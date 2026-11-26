package expo.modules.framecapture

import android.graphics.Bitmap
import android.graphics.RectF
import android.graphics.SurfaceTexture
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.opengl.GLES11Ext
import android.opengl.GLES20
import android.os.Handler
import android.os.HandlerThread
import android.util.Size
import android.view.Surface
import org.webrtc.EglBase
import org.webrtc.GlRectDrawer
import org.webrtc.GlUtil
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.Semaphore
import java.util.concurrent.TimeUnit
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.floor

private const val CODEC_TIMEOUT_US = 10_000L
private const val MAX_CODEC_WAIT_TRIES = 500
private const val DECODED_FRAME_WAIT_MS = 2500L
private const val NANOS_PER_MICRO = 1000L
private const val BYTES_PER_PIXEL = 4
private const val DETECTION_INPUT_SIZE = 640
private const val CHANGE_GRID_LONG = 16
private const val CHANGE_GRID_SHORT = 9
private const val CHANGE_SAMPLES_PER_SIDE = 160
private const val CHANGE_THRESHOLD = 10f
private const val DETECT_ERROR_CODE = "ERR_CLIP_MASK_DETECT"
private const val WRITE_ERROR_CODE = "ERR_CLIP_MASK_WRITE"

/** 검출 시점의 사람 영역 */
private class PersonFrame(val timeUs: Long, val boxes: List<RectF>)

/** 가림 처리 중 영상이 취소됐을 때의 예외 */
internal class ClipCancelledException : Exception("Video clip masking cancelled")

/** 실패한 가림 단계의 오류 코드를 담은 예외 */
internal class ClipMaskException(val errorCode: String, cause: Throwable) : Exception(cause.message, cause)

/** 디코딩 프레임을 받는 texture */
private class FrameTexture {
  private val listenerThread = HandlerThread("frame-capture-mask").apply { start() }
  private val frameAvailable = Semaphore(0)

  // EGL context가 현재 스레드에 연결된 뒤 생성
  val textureId = GlUtil.generateTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES)
  val matrix = FloatArray(16)
  private val surfaceTexture = SurfaceTexture(textureId).apply {
    setOnFrameAvailableListener({ frameAvailable.release() }, Handler(listenerThread.looper))
  }
  val surface = Surface(surfaceTexture)

  /** 디코더가 렌더링한 프레임을 texture로 가져오는 함수 */
  fun awaitFrame() {
    check(frameAvailable.tryAcquire(DECODED_FRAME_WAIT_MS, TimeUnit.MILLISECONDS)) { "Decoded frame timed out" }

    surfaceTexture.updateTexImage()
    surfaceTexture.getTransformMatrix(matrix)
  }

  /** texture 해제 함수 */
  fun release() {
    surface.release()
    surfaceTexture.release()
    GLES20.glDeleteTextures(1, intArrayOf(textureId), 0)
    listenerThread.quitSafely()
  }
}

/** 가린 영상을 MP4로 쓰는 인코더 */
private class MaskedClipWriter(output: File, width: Int, height: Int, bitrate: Int, frameRate: Int) {
  // 인코더 생성 실패 시 해제할 수 있게 muxer를 먼저 생성
  private val muxer = MediaMuxer(output.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
  private val codec: MediaCodec = try {
    MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
  } catch (e: Exception) {
    muxer.release()

    throw e
  }
  private val info = MediaCodec.BufferInfo()
  private var track = -1
  val inputSurface: Surface

  init {
    try {
      codec.configure(avcEncoderFormat(width, height, bitrate, frameRate), null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      inputSurface = codec.createInputSurface()
      codec.start()
    } catch (e: Exception) {
      codec.release()
      muxer.release()

      throw e
    }
  }

  /** 인코더 출력을 MP4에 쓰는 함수 */
  fun drain(streamEnded: Boolean) {
    var tries = 0

    while (true) {
      // 영상 끝이 아니면 기다리지 않음
      val index = codec.dequeueOutputBuffer(info, if (streamEnded) CODEC_TIMEOUT_US else 0)

      if (index == MediaCodec.INFO_TRY_AGAIN_LATER) {
        if (!streamEnded) {
          return
        }

        tries += 1
        check(tries < MAX_CODEC_WAIT_TRIES) { "Encoder output timed out" }
      } else if (index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
        track = muxer.addTrack(codec.outputFormat)
        muxer.start()
      } else if (index >= 0) {
        val output = codec.getOutputBuffer(index)

        if (output != null && track >= 0 && info.size > 0 && info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0) {
          muxer.writeSampleData(track, output, info)
        }

        codec.releaseOutputBuffer(index, false)

        if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
          return
        }
      }
    }
  }

  /** 영상 끝을 알리고 파일을 닫는 함수 */
  fun finish() {
    codec.signalEndOfInputStream()
    drain(true)
    check(track >= 0) { "Encoder produced no output" }
    muxer.stop()
  }

  /** 인코더 해제 함수 */
  fun release() {
    try {
      codec.release()
      inputSurface.release()
    } finally {
      muxer.release()
    }
  }
}

/** 저장한 영상의 사람을 검정으로 가리는 객체 */
object ClipMasker {
  /** input 영상의 사람을 가려 output에 저장하는 함수 */
  fun mask(
    input: File,
    output: File,
    settings: PersonMaskSettings,
    bitrate: Int,
    frameRate: Int,
    isCancelled: () -> Boolean,
  ) {
    val size = withErrorCode(DETECT_ERROR_CODE) { videoSize(input) }
    val personFrames = withErrorCode(DETECT_ERROR_CODE) {
      detectPeople(input, size, settings, isCancelled).also { check(it.isNotEmpty()) { "Video clip has no frames" } }
    }

    withErrorCode(WRITE_ERROR_CODE) {
      // 사람이 없으면 다시 인코딩하지 않음
      if (personFrames.all { it.boxes.isEmpty() }) {
        check(input.renameTo(output)) { "Video clip rename failed" }
      } else {
        writeMasked(input, output, size, personFrames, settings, bitrate, frameRate, isCancelled)
      }
    }
  }

  /** 실패한 가림 단계를 오류 코드로 표시하는 함수 */
  private inline fun <T> withErrorCode(errorCode: String, step: () -> T): T {
    try {
      return step()
    } catch (e: ClipCancelledException) {
      throw e
    } catch (e: Throwable) {
      throw ClipMaskException(errorCode, e)
    }
  }

  /** 영상 크기 반환 함수 */
  private fun videoSize(input: File): Size {
    val extractor = MediaExtractor()

    try {
      extractor.setDataSource(input.absolutePath)

      val format = extractor.getTrackFormat(videoTrack(extractor))

      return Size(format.getInteger(MediaFormat.KEY_WIDTH), format.getInteger(MediaFormat.KEY_HEIGHT))
    } finally {
      extractor.release()
    }
  }

  /** 일정 간격 사람 검출 함수 */
  private fun detectPeople(
    input: File,
    size: Size,
    settings: PersonMaskSettings,
    isCancelled: () -> Boolean,
  ): List<PersonFrame> {
    val personFrames = mutableListOf<PersonFrame>()
    val intervalUs = settings.intervalMs.toLong() * MICROS_PER_MILLI
    val isLandscape = size.width >= size.height
    val gridColumns = if (isLandscape) CHANGE_GRID_LONG else CHANGE_GRID_SHORT
    val gridRows = if (isLandscape) CHANGE_GRID_SHORT else CHANGE_GRID_LONG
    val pixels = ByteBuffer
      .allocateDirect(DETECTION_INPUT_SIZE * DETECTION_INPUT_SIZE * BYTES_PER_PIXEL)
      .order(ByteOrder.nativeOrder())
    val eglBase = EglBase.create(null, EglBase.CONFIG_PIXEL_RGBA_BUFFER)
    var nextUs = 0L
    var detectedBrightness: FloatArray? = null

    try {
      eglBase.createPbufferSurface(DETECTION_INPUT_SIZE, DETECTION_INPUT_SIZE)
      eglBase.makeCurrent()

      val texture = FrameTexture()
      val drawer = GlRectDrawer()

      try {
        decode(input, texture.surface, isCancelled, { timeUs -> timeUs >= nextUs }) { timeUs ->
          texture.awaitFrame()

          // 모델 입력과 같게 늘려 그림
          drawer.drawOes(
            texture.textureId,
            texture.matrix,
            size.width,
            size.height,
            0,
            0,
            DETECTION_INPUT_SIZE,
            DETECTION_INPUT_SIZE,
          )

          pixels.rewind()
          GLES20.glReadPixels(
            0,
            0,
            DETECTION_INPUT_SIZE,
            DETECTION_INPUT_SIZE,
            GLES20.GL_RGBA,
            GLES20.GL_UNSIGNED_BYTE,
            pixels,
          )

          val brightness = cellBrightness(pixels, gridColumns, gridRows)
          val lastFrame = personFrames.lastOrNull()
          val lastBrightness = detectedBrightness

          // 마지막 검출 이후 화면이 그대로면 검출 결과를 재사용
          if (lastFrame != null && lastBrightness != null && !hasChanged(lastBrightness, brightness)) {
            personFrames += PersonFrame(timeUs, lastFrame.boxes)
          } else {
            personFrames += PersonFrame(timeUs, detectBoxes(pixels, size, settings.scoreThreshold.toFloat()))
            detectedBrightness = brightness
          }

          nextUs = timeUs + intervalUs
        }
      } finally {
        drawer.release()
        texture.release()
      }
    } finally {
      eglBase.release()
    }

    return personFrames
  }

  /** 칸별 평균 밝기 계산 함수 */
  private fun cellBrightness(pixels: ByteBuffer, columns: Int, rows: Int): FloatArray {
    val step = DETECTION_INPUT_SIZE / CHANGE_SAMPLES_PER_SIDE
    val sums = FloatArray(columns * rows)
    val counts = IntArray(columns * rows)

    for (y in 0 until DETECTION_INPUT_SIZE step step) {
      val rowCell = y * rows / DETECTION_INPUT_SIZE * columns

      for (x in 0 until DETECTION_INPUT_SIZE step step) {
        val offset = (y * DETECTION_INPUT_SIZE + x) * BYTES_PER_PIXEL
        val red = pixels.get(offset).toInt() and 0xFF
        val green = pixels.get(offset + 1).toInt() and 0xFF
        val blue = pixels.get(offset + 2).toInt() and 0xFF
        val cell = rowCell + x * columns / DETECTION_INPUT_SIZE

        // BT.601 밝기 변환식
        sums[cell] += 0.299f * red + 0.587f * green + 0.114f * blue
        counts[cell] += 1
      }
    }

    return FloatArray(sums.size) { sums[it] / counts[it] }
  }

  /** 밝기가 바뀐 칸 확인 함수 */
  private fun hasChanged(previous: FloatArray, current: FloatArray): Boolean {
    return previous.indices.any { abs(previous[it] - current[it]) >= CHANGE_THRESHOLD }
  }

  /** 모델 입력 픽셀의 사람 영역 반환 함수 */
  private fun detectBoxes(pixels: ByteBuffer, size: Size, scoreThreshold: Float): List<RectF> {
    val scaleX = size.width.toFloat() / DETECTION_INPUT_SIZE
    val scaleY = size.height.toFloat() / DETECTION_INPUT_SIZE
    val frameBitmap = flippedBitmap(pixels)

    try {
      return PersonMasker.detect(frameBitmap, scoreThreshold).map {
        RectF(it.left * scaleX, it.top * scaleY, it.right * scaleX, it.bottom * scaleY)
      }
    } finally {
      frameBitmap.recycle()
    }
  }

  /** GL 픽셀 상하 반전 함수 */
  private fun flippedBitmap(pixels: ByteBuffer): Bitmap {
    val rowBytes = DETECTION_INPUT_SIZE * BYTES_PER_PIXEL
    val flipped = ByteArray(rowBytes * DETECTION_INPUT_SIZE)

    for (row in 0 until DETECTION_INPUT_SIZE) {
      pixels.position((DETECTION_INPUT_SIZE - 1 - row) * rowBytes)
      pixels.get(flipped, row * rowBytes, rowBytes)
    }

    return Bitmap.createBitmap(DETECTION_INPUT_SIZE, DETECTION_INPUT_SIZE, Bitmap.Config.ARGB_8888).apply {
      copyPixelsFromBuffer(ByteBuffer.wrap(flipped))
    }
  }

  /** 앞뒤 검출 결과를 합쳐 가린 영상을 쓰는 함수 */
  private fun writeMasked(
    input: File,
    output: File,
    size: Size,
    personFrames: List<PersonFrame>,
    settings: PersonMaskSettings,
    bitrate: Int,
    frameRate: Int,
    isCancelled: () -> Boolean,
  ) {
    val mergeUs = settings.mergeMs.toLong() * MICROS_PER_MILLI
    val writer = MaskedClipWriter(output, size.width, size.height, bitrate, frameRate)
    val eglBase = try {
      EglBase.create(null, EglBase.CONFIG_RECORDABLE)
    } catch (e: Exception) {
      writer.release()

      throw e
    }

    try {
      eglBase.createSurface(writer.inputSurface)
      eglBase.makeCurrent()

      val texture = FrameTexture()
      val drawer = GlRectDrawer()

      try {
        decode(input, texture.surface, isCancelled, { true }) { timeUs ->
          val boxes = personFrames
            .filter { abs(it.timeUs - timeUs) <= mergeUs }
            .flatMap { it.boxes }
            .map { PersonMasker.expandedBox(it, settings.margin.toFloat(), size.width, size.height) }

          texture.awaitFrame()
          drawer.drawOes(texture.textureId, texture.matrix, size.width, size.height, 0, 0, size.width, size.height)
          blackOut(boxes, size.height)
          eglBase.swapBuffers(timeUs * NANOS_PER_MICRO)
          writer.drain(false)
        }

        writer.finish()
      } finally {
        drawer.release()
        texture.release()
      }
    } finally {
      eglBase.release()
      writer.release()
    }
  }

  /** 사람 영역을 검정으로 칠하는 함수 */
  private fun blackOut(boxes: List<RectF>, height: Int) {
    if (boxes.isEmpty()) {
      return
    }

    GLES20.glEnable(GLES20.GL_SCISSOR_TEST)
    GLES20.glClearColor(0f, 0f, 0f, 1f)

    for (box in boxes) {
      val left = floor(box.left).toInt()
      val top = floor(box.top).toInt()
      val right = ceil(box.right).toInt()
      val bottom = ceil(box.bottom).toInt()

      // GL 좌표는 아래쪽이 0
      GLES20.glScissor(left, height - bottom, right - left, bottom - top)
      GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
    }

    GLES20.glDisable(GLES20.GL_SCISSOR_TEST)
  }

  /** 영상 트랙 번호 반환 함수 */
  private fun videoTrack(extractor: MediaExtractor): Int {
    return (0 until extractor.trackCount).first {
      extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME)?.startsWith("video/") == true
    }
  }

  /** 영상을 처음부터 끝까지 Surface로 디코딩하는 함수 */
  private fun decode(
    input: File,
    surface: Surface,
    isCancelled: () -> Boolean,
    shouldRender: (Long) -> Boolean,
    onRendered: (Long) -> Unit,
  ) {
    val extractor = MediaExtractor()

    try {
      extractor.setDataSource(input.absolutePath)

      val track = videoTrack(extractor)
      val format = extractor.getTrackFormat(track)
      val decoder = MediaCodec.createDecoderByType(checkNotNull(format.getString(MediaFormat.KEY_MIME)))

      extractor.selectTrack(track)

      try {
        decoder.configure(format, surface, null, 0)
        decoder.start()
        decodeFrames(extractor, decoder, isCancelled, shouldRender, onRendered)
      } finally {
        decoder.release()
      }
    } finally {
      extractor.release()
    }
  }

  /** 디코더에 압축 프레임을 넣고 필요한 프레임만 그리는 함수 */
  private fun decodeFrames(
    extractor: MediaExtractor,
    decoder: MediaCodec,
    isCancelled: () -> Boolean,
    shouldRender: (Long) -> Boolean,
    onRendered: (Long) -> Unit,
  ) {
    val info = MediaCodec.BufferInfo()
    var inputDone = false
    var idleTries = 0

    while (true) {
      if (isCancelled()) {
        throw ClipCancelledException()
      }

      var inputQueued = false

      if (!inputDone) {
        val inputIndex = decoder.dequeueInputBuffer(CODEC_TIMEOUT_US)

        if (inputIndex >= 0) {
          inputQueued = true

          val size = extractor.readSampleData(checkNotNull(decoder.getInputBuffer(inputIndex)), 0)

          if (size < 0) {
            decoder.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
            inputDone = true
          } else {
            decoder.queueInputBuffer(inputIndex, 0, size, extractor.sampleTime, 0)
            extractor.advance()
          }
        }
      }

      val outputIndex = decoder.dequeueOutputBuffer(info, CODEC_TIMEOUT_US)

      if (outputIndex < 0) {
        // 입력도 출력도 진행되지 않으면 실패로 처리
        idleTries = if (inputQueued) 0 else idleTries + 1
        check(idleTries < MAX_CODEC_WAIT_TRIES) { "Decoder output timed out" }

        continue
      }

      idleTries = 0

      val shouldRenderFrame = info.size > 0 && shouldRender(info.presentationTimeUs)

      decoder.releaseOutputBuffer(outputIndex, shouldRenderFrame)

      if (shouldRenderFrame) {
        onRendered(info.presentationTimeUs)
      }

      if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
        return
      }
    }
  }
}
