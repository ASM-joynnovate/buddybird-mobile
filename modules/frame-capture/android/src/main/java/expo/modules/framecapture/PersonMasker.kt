package expo.modules.framecapture

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.vision.objectdetector.ObjectDetector
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required

private const val PERSON_MODEL_FILE = "deim_n_person.tflite"
private const val PERSON_CATEGORY = "person"

/** JS에서 받는 사람 가림 설정 */
class PersonMaskSettings : Record {
  @Field @Required val scoreThreshold: Double = 0.0

  /** 사방으로 넓힐 박스 크기 비율 */
  @Field @Required val margin: Double = 0.0

  @Field @Required val intervalMs: Double = 0.0

  @Field @Required val mergeMs: Double = 0.0
}

/** 사람을 검출해 검정으로 가리는 객체 */
object PersonMasker {
  private val lock = Any()
  private val blackPaint = Paint().apply { color = Color.BLACK }

  private lateinit var context: Context

  // lock 안에서만 사용
  private var detector: ObjectDetector? = null
  private var detectorScoreThreshold = 0f

  /** 모델을 읽을 context 설정 함수 */
  fun initialize(context: Context) {
    this.context = context
  }

  /** 사진 속 사람 영역 목록 반환 함수 */
  fun detect(photo: Bitmap, scoreThreshold: Float): List<RectF> {
    synchronized(lock) {
      val result = loadDetector(scoreThreshold).detect(BitmapImageBuilder(photo).build())

      return result.detections().map { it.boundingBox() }
    }
  }

  /** 사람 영역을 검정으로 칠한 사진 반환 함수 */
  fun maskedPhoto(photo: Bitmap, boxes: List<RectF>, margin: Float): Bitmap {
    if (boxes.isEmpty()) {
      return photo
    }

    val masked = photo.copy(Bitmap.Config.ARGB_8888, true)
    val canvas = Canvas(masked)

    for (box in boxes) {
      canvas.drawRect(expandedBox(box, margin, photo.width, photo.height), blackPaint)
    }

    return masked
  }

  /** 사방으로 margin 비율만큼 넓힌 영역 반환 함수 */
  fun expandedBox(box: RectF, margin: Float, width: Int, height: Int): RectF {
    val dx = box.width() * margin
    val dy = box.height() * margin

    return RectF(
      maxOf(0f, box.left - dx),
      maxOf(0f, box.top - dy),
      minOf(width.toFloat(), box.right + dx),
      minOf(height.toFloat(), box.bottom + dy),
    )
  }

  /** 검출 모델 생성 함수 */
  private fun loadDetector(scoreThreshold: Float): ObjectDetector {
    detector?.let {
      if (detectorScoreThreshold == scoreThreshold) {
        return it
      }

      // 기준 점수가 바뀌면 다시 생성
      it.close()
      detector = null
    }

    val personDetector = createObjectDetector(
      context,
      PERSON_MODEL_FILE,
      PERSON_CATEGORY,
      scoreThreshold = scoreThreshold,
      maxResults = null,
    )

    return personDetector.also {
      detector = it
      detectorScoreThreshold = scoreThreshold
    }
  }
}
