package expo.modules.framecapture

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.net.Uri
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.components.containers.Detection
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.objectdetector.ObjectDetector
import expo.modules.kotlin.Promise
import org.webrtc.VideoFrame
import java.io.File
import java.nio.ByteBuffer
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

private const val MODEL_FILE = "efficientdet_lite2.tflite"
private const val BIRD_CATEGORY = "bird"
private const val FRAME_WAIT_MS = 5000L
private const val LUMA_BLACK = 16f
private const val LUMA_RANGE = 219f
private const val CHROMA_CENTER = 128f
private const val MAX_BRIGHTNESS = 255.0

/** 진행 중인 앵무새 확인 한 번 */
private class ParrotCheck(
  val nightCorrectionEnabled: Boolean,
  val nightStartBrightness: Double,
  val mergeMs: Long,
  val quality: Int,
  val promise: Promise,
) {
  var width = 0
  var height = 0
  var rotation = 0
  var frameCount = 0
  var firstFrameAt = 0L
  var framesMerging = false
  var lumaSum = IntArray(0)
  var uSum = IntArray(0)
  var vSum = IntArray(0)

  /** 프레임 한 장을 누적하는 함수 */
  fun add(i420: VideoFrame.I420Buffer) {
    val chromaWidth = (width + 1) / 2
    val chromaHeight = (height + 1) / 2

    addPlane(i420.dataY, i420.strideY, width, height, lumaSum)
    addPlane(i420.dataU, i420.strideU, chromaWidth, chromaHeight, uSum)
    addPlane(i420.dataV, i420.strideV, chromaWidth, chromaHeight, vSum)

    frameCount += 1
  }

  /** 합친 프레임의 평균 밝기를 0~255로 반환하는 함수 */
  fun brightness(): Double {
    var total = 0L

    for (value in lumaSum) {
      total += value
    }

    val mean = total.toDouble() / lumaSum.size / frameCount

    return ((mean - LUMA_BLACK) * MAX_BRIGHTNESS / LUMA_RANGE).coerceIn(0.0, MAX_BRIGHTNESS)
  }

  /** 합친 프레임으로 밝은 Bitmap을 만드는 함수 */
  fun toBitmap(gain: Float): Bitmap {
    val chromaWidth = (width + 1) / 2
    val scale = gain / frameCount
    val lumaOffset = LUMA_BLACK * gain
    val chromaOffset = CHROMA_CENTER * gain
    val pixels = IntArray(width * height)

    // BT.601 limited range 변환식
    for (y in 0 until height) {
      val chromaRow = (y / 2) * chromaWidth

      for (x in 0 until width) {
        val luma = 1.164f * (lumaSum[y * width + x] * scale - lumaOffset)
        val u = uSum[chromaRow + x / 2] * scale - chromaOffset
        val v = vSum[chromaRow + x / 2] * scale - chromaOffset
        val red = (luma + 1.596f * v).toInt().coerceIn(0, 255)
        val green = (luma - 0.392f * u - 0.813f * v).toInt().coerceIn(0, 255)
        val blue = (luma + 2.017f * u).toInt().coerceIn(0, 255)

        pixels[y * width + x] = (0xFF shl 24) or (red shl 16) or (green shl 8) or blue
      }
    }

    return Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888)
  }

  private fun addPlane(plane: ByteBuffer, stride: Int, planeWidth: Int, planeHeight: Int, sum: IntArray) {
    val source = plane.duplicate()
    val row = ByteArray(planeWidth)

    for (y in 0 until planeHeight) {
      source.position(y * stride)
      source.get(row, 0, planeWidth)

      val offset = y * planeWidth

      for (x in 0 until planeWidth) {
        sum[offset + x] += row[x].toInt() and 0xFF
      }
    }
  }
}

/** 카메라 프레임에서 앵무새를 검출하는 객체 */
object ParrotChecker {
  private val worker = Executors.newSingleThreadScheduledExecutor()
  private val frameBusy = AtomicBoolean(false)

  private lateinit var context: Context
  private lateinit var outputDir: File

  @Volatile private var check: ParrotCheck? = null
  private var detector: ObjectDetector? = null

  fun initialize(context: Context, outputDir: File) {
    this.context = context
    this.outputDir = outputDir
  }

  /** 다음 프레임으로 앵무새 확인을 요청하는 함수 */
  fun request(nightCorrectionEnabled: Boolean, nightStartBrightness: Double, mergeMs: Long, quality: Int, promise: Promise) {
    worker.execute {
      check?.promise?.resolve(null)

      val requested = ParrotCheck(nightCorrectionEnabled, nightStartBrightness, mergeMs, quality, promise)

      check = requested

      worker.schedule(Runnable { finishLate(requested) }, mergeMs + FRAME_WAIT_MS, TimeUnit.MILLISECONDS)
    }
  }

  /** 확인 중일 때 프레임을 넘겨받는 함수 */
  fun onFrame(frame: VideoFrame) {
    if (check == null || !frameBusy.compareAndSet(false, true)) {
      return
    }

    val i420 = try {
      frame.buffer.toI420()
    } catch (e: Exception) {
      null
    }

    if (i420 == null) {
      frameBusy.set(false)

      return
    }

    val rotation = frame.rotation

    // 변환 및 검출은 worker 스레드에서 실행
    worker.execute {
      try {
        addFrame(i420, rotation)
      } catch (e: Exception) {
        val failed = check

        check = null
        failed?.promise?.reject("ERR_PARROT_CHECK", e.message, e)
      } finally {
        i420.release()
        frameBusy.set(false)
      }
    }
  }

  private fun addFrame(i420: VideoFrame.I420Buffer, rotation: Int) {
    val current = check ?: return

    if (current.frameCount == 0) {
      val chromaSize = ((i420.width + 1) / 2) * ((i420.height + 1) / 2)

      current.width = i420.width
      current.height = i420.height
      current.lumaSum = IntArray(i420.width * i420.height)
      current.uSum = IntArray(chromaSize)
      current.vSum = IntArray(chromaSize)
      current.firstFrameAt = System.currentTimeMillis()
    } else if (i420.width != current.width || i420.height != current.height) {
      return
    }

    current.rotation = rotation
    current.add(i420)

    if (current.frameCount == 1) {
      current.framesMerging = current.nightCorrectionEnabled && current.brightness() < current.nightStartBrightness
    }

    if (!current.framesMerging || System.currentTimeMillis() - current.firstFrameAt >= current.mergeMs) {
      finish(current)
    }
  }

  /** 시간이 초과된 확인을 종료하는 함수 */
  private fun finishLate(requested: ParrotCheck) {
    if (check !== requested) {
      return
    }

    if (requested.frameCount == 0) {
      check = null
      requested.promise.resolve(null)

      return
    }

    finish(requested)
  }

  private fun finish(finished: ParrotCheck) {
    check = null

    try {
      val brightness = finished.brightness()
      val gain = if (finished.framesMerging) maxOf(1.0, finished.nightStartBrightness / maxOf(brightness, 1.0)).toFloat() else 1f
      val photo = upright(finished.toBitmap(gain), finished.rotation)

      val startedAt = System.nanoTime()
      val detection = birdDetection(photo)
      val inferenceMs = (System.nanoTime() - startedAt) / 1_000_000.0
      val birdScore = detection?.categories()?.maxOfOrNull { it.score() } ?: 0f
      val birdBox = detection?.boundingBox()?.let {
        mapOf(
          "x" to (it.left / photo.width).toDouble(),
          "y" to (it.top / photo.height).toDouble(),
          "width" to (it.width() / photo.width).toDouble(),
          "height" to (it.height() / photo.height).toDouble(),
        )
      }
      val photoWidth = photo.width
      val photoHeight = photo.height

      val file = File(outputDir, "photo-${finished.firstFrameAt}.jpg")

      file.outputStream().use { photo.compress(Bitmap.CompressFormat.JPEG, finished.quality, it) }
      photo.recycle()

      finished.promise.resolve(
        mapOf(
          "uri" to Uri.fromFile(file).toString(),
          "capturedAt" to finished.firstFrameAt.toDouble(),
          "birdScore" to birdScore.toDouble(),
          "birdBox" to birdBox,
          "photoWidth" to photoWidth,
          "photoHeight" to photoHeight,
          "brightness" to brightness,
          "nightCorrected" to finished.framesMerging,
          "inferenceMs" to inferenceMs,
        ),
      )
    } catch (e: Throwable) {
      // Error도 JS에 전달
      finished.promise.reject("ERR_PARROT_CHECK", e.message, e)
    }
  }

  /** 사진 방향을 바로잡는 함수 */
  private fun upright(bitmap: Bitmap, rotation: Int): Bitmap {
    if (rotation == 0) {
      return bitmap
    }

    val matrix = Matrix().apply { postRotate(rotation.toFloat()) }
    val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)

    bitmap.recycle()

    return rotated
  }

  /** 사진에서 bird 점수가 가장 높은 검출 결과를 반환하는 함수 */
  private fun birdDetection(photo: Bitmap): Detection? {
    val result = loadDetector().detect(BitmapImageBuilder(photo).build())

    return result.detections().maxByOrNull { detection -> detection.categories().maxOfOrNull { it.score() } ?: 0f }
  }

  private fun loadDetector(): ObjectDetector {
    detector?.let { return it }

    val options = ObjectDetector.ObjectDetectorOptions.builder()
      .setBaseOptions(BaseOptions.builder().setModelAssetPath(MODEL_FILE).build())
      .setRunningMode(RunningMode.IMAGE)
      .setCategoryAllowlist(listOf(BIRD_CATEGORY))
      // 기준 점수는 JS에서 비교
      .setScoreThreshold(0f)
      .setMaxResults(1)
      .build()

    return ObjectDetector.createFromOptions(context, options).also { detector = it }
  }
}
