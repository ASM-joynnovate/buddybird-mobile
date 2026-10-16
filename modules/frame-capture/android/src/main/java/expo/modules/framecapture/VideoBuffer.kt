package expo.modules.framecapture

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import android.view.Surface
import com.oney.WebRTCModule.EglUtils
import expo.modules.kotlin.Promise
import org.webrtc.EglBase
import org.webrtc.GlRectDrawer
import org.webrtc.VideoFrame
import org.webrtc.VideoFrameDrawer
import java.io.File
import java.nio.ByteBuffer
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

private const val TAG = "FrameCapture"
private const val KEYFRAME_INTERVAL_SECONDS = 2
private const val NANOS_PER_SECOND = 1_000_000_000L
private const val MICROS_PER_MILLI = 1000L

private class EncodedSample(val data: ByteArray, val timeUs: Long, val keyframe: Boolean)

/** 프레임을 H.264로 압축하는 인코더 */
private class Encoder(val width: Int, val height: Int, frameRate: Int, bitrate: Int) {
  val codec: MediaCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
  val surface: Surface
  val eglBase: EglBase
  val drawer = GlRectDrawer()
  val frameDrawer = VideoFrameDrawer()
  var outputFormat: MediaFormat? = null

  init {
    val format = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height).apply {
      setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
      setInteger(MediaFormat.KEY_BIT_RATE, bitrate)
      setInteger(MediaFormat.KEY_FRAME_RATE, frameRate)
      setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, KEYFRAME_INTERVAL_SECONDS)
    }

    try {
      codec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
      surface = codec.createInputSurface()
      codec.start()

      // 카메라 texture를 렌더링하도록 context 공유
      eglBase = EglBase.create(EglUtils.getRootEglBaseContext(), EglBase.CONFIG_RECORDABLE)
      eglBase.createSurface(surface)
      eglBase.makeCurrent()
    } catch (e: Exception) {
      codec.release()

      throw e
    }
  }

  fun release() {
    try {
      drawer.release()
      frameDrawer.release()
      eglBase.release()
    } finally {
      codec.release()
      surface.release()
    }
  }
}

/** 최근 영상을 압축해 유지하는 객체 */
object VideoBuffer {
  private val writer = Executors.newSingleThreadExecutor()
  private val frameBusy = AtomicBoolean(false)
  private val samples = ArrayDeque<EncodedSample>()
  private val finishClip = Runnable { writeClip() }

  private lateinit var outputDir: File

  @Volatile private var handler: Handler? = null
  @Volatile private var lastFrameNs = 0L
  private var thread: HandlerThread? = null

  private var longSide = 0
  private var frameRate = 0
  private var bitrate = 0
  private var beforeUs = 0L
  private var frameIntervalNs = 0L

  // 인코더 스레드에서만 사용
  private var encoder: Encoder? = null
  private var encoderFailed = false
  private var clipPromise: Promise? = null

  fun initialize(outputDir: File) {
    this.outputDir = outputDir
  }

  /** 영상을 메모리에 유지하기 시작하는 함수 */
  fun start(width: Int, height: Int, frameRate: Int, bitrate: Int, beforeMs: Long) {
    stop()

    val started = HandlerThread("frame-capture-video").apply { start() }

    this.longSide = maxOf(width, height)
    this.frameRate = frameRate
    this.bitrate = bitrate
    this.beforeUs = beforeMs * MICROS_PER_MILLI
    this.frameIntervalNs = NANOS_PER_SECOND / frameRate
    this.lastFrameNs = 0L
    this.encoderFailed = false

    thread = started
    handler = Handler(started.looper)
  }

  /** 영상 유지를 멈추는 함수 */
  fun stop() {
    val stopping = handler ?: return
    val stoppingThread = thread

    handler = null
    thread = null

    stopping.post {
      // 대기 중인 프레임이 인코더를 다시 생성하지 않게 함
      encoderFailed = true

      cancelClip(stopping)
      releaseEncoder()
      samples.clear()
    }
    stoppingThread?.quitSafely()
    stoppingThread?.join()
  }

  /** afterMs 뒤에 영상을 MP4로 저장하는 함수 */
  fun saveClip(afterMs: Long, promise: Promise) {
    val target = handler

    if (target == null) {
      promise.resolve(null)

      return
    }

    val posted = target.post {
      // 저장 중이던 영상은 현재까지만 저장
      if (clipPromise != null) {
        target.removeCallbacks(finishClip)
        writeClip()
      }

      clipPromise = promise
      target.postDelayed(finishClip, afterMs)
    }

    if (!posted) {
      promise.resolve(null)
    }
  }

  /** 저장 중인 영상을 취소하는 함수 */
  fun discardClip() {
    val target = handler ?: return

    target.post { cancelClip(target) }
  }

  /** 영상을 유지 중일 때 프레임을 넘겨받는 함수 */
  fun onFrame(frame: VideoFrame) {
    val target = handler ?: return

    // 설정한 프레임 수를 넘는 프레임은 제외
    if (frame.timestampNs - lastFrameNs < frameIntervalNs * 3 / 4 || !frameBusy.compareAndSet(false, true)) {
      return
    }

    lastFrameNs = frame.timestampNs
    frame.retain()

    val posted = target.post {
      try {
        encode(frame)
      } catch (e: Exception) {
        Log.e(TAG, "Video buffer encoding failed", e)
        encoderFailed = true
        cancelClip(target)
        releaseEncoder()
        samples.clear()
      } finally {
        frame.release()
        frameBusy.set(false)
      }
    }

    if (!posted) {
      frame.release()
      frameBusy.set(false)
    }
  }

  private fun encode(frame: VideoFrame) {
    if (encoderFailed) {
      return
    }

    val frameLongSide = maxOf(frame.rotatedWidth, frame.rotatedHeight)
    val frameShortSide = minOf(frame.rotatedWidth, frame.rotatedHeight)
    val shortSide = longSide * frameShortSide / frameLongSide / 2 * 2
    val width = if (frame.rotatedWidth >= frame.rotatedHeight) longSide else shortSide
    val height = if (frame.rotatedWidth >= frame.rotatedHeight) shortSide else longSide

    var current = encoder

    // 크기가 바뀌면 새 인코더로 다시 시작
    if (current == null || current.width != width || current.height != height) {
      handler?.let { cancelClip(it) }
      releaseEncoder()
      samples.clear()

      current = Encoder(width, height, frameRate, bitrate)
      encoder = current
    }

    current.frameDrawer.drawFrame(frame, current.drawer, null, 0, 0, width, height)
    current.eglBase.swapBuffers(frame.timestampNs)

    drain(current)
  }

  /** 인코더 출력을 버퍼에 추가하는 함수 */
  private fun drain(current: Encoder) {
    val info = MediaCodec.BufferInfo()

    while (true) {
      val index = current.codec.dequeueOutputBuffer(info, 0)

      if (index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
        current.outputFormat = current.codec.outputFormat
      } else if (index >= 0) {
        val output = current.codec.getOutputBuffer(index)

        if (output != null && info.size > 0 && info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0) {
          val data = ByteArray(info.size)

          output.position(info.offset)
          output.get(data)

          addSample(EncodedSample(data, info.presentationTimeUs, info.flags and MediaCodec.BUFFER_FLAG_KEY_FRAME != 0))
        }

        current.codec.releaseOutputBuffer(index, false)
      } else if (index == MediaCodec.INFO_TRY_AGAIN_LATER) {
        return
      }
    }
  }

  private fun addSample(sample: EncodedSample) {
    samples.addLast(sample)

    // 영상을 저장하는 동안에는 삭제하지 않음
    if (clipPromise != null) {
      return
    }

    // 유지할 길이보다 오래된 키프레임 앞까지 삭제
    val cutoffUs = sample.timeUs - beforeUs
    val firstKept = samples.indexOfLast { it.keyframe && it.timeUs <= cutoffUs }

    repeat(firstKept) { samples.removeFirst() }
  }

  private fun cancelClip(target: Handler) {
    target.removeCallbacks(finishClip)

    clipPromise?.resolve(null)
    clipPromise = null
  }

  /** 버퍼의 영상을 MP4 파일로 저장하는 함수 */
  private fun writeClip() {
    val promise = clipPromise ?: return
    val format = encoder?.outputFormat
    val clip = samples.dropWhile { !it.keyframe }

    clipPromise = null

    if (format == null || clip.isEmpty()) {
      promise.resolve(null)

      return
    }

    val file = File(outputDir, "clip-${System.currentTimeMillis()}.mp4")

    writer.execute {
      try {
        val muxer = MediaMuxer(file.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

        try {
          val track = muxer.addTrack(format)
          val info = MediaCodec.BufferInfo()
          val startUs = clip.first().timeUs

          muxer.start()

          for (sample in clip) {
            info.set(0, sample.data.size, sample.timeUs - startUs, if (sample.keyframe) MediaCodec.BUFFER_FLAG_KEY_FRAME else 0)
            muxer.writeSampleData(track, ByteBuffer.wrap(sample.data), info)
          }

          muxer.stop()
        } finally {
          muxer.release()
        }

        promise.resolve(Uri.fromFile(file).toString())
      } catch (e: Exception) {
        file.delete()
        promise.reject("ERR_VIDEO_CLIP", e.message, e)
      }
    }
  }

  private fun releaseEncoder() {
    val releasing = encoder ?: return

    encoder = null

    try {
      releasing.release()
    } catch (e: Exception) {
      Log.e(TAG, "Video buffer encoder release failed", e)
    }
  }
}
