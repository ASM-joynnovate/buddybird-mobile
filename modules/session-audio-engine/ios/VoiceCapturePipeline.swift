import Foundation

final class VoiceCapturePipeline {
  var onCaptured: ((NativeCapturedSegment) -> Void)?
  var onFailure: ((Error) -> Void)?

  private let configuration: NativeSessionConfiguration
  private let store: PendingCaptureStore
  private var pendingSamples: [Int16] = []
  private var ringBuffer: [Int16] = []
  private var segmentSamples: [Int16] = []
  private var aboveMs: Int64 = 0
  private var belowMs: Int64 = 0
  private var voiceActive = false
  private var speechStartMs: Int64 = 0
  private var phase = "learning"
  private var cycle = 1

  init(configuration: NativeSessionConfiguration, store: PendingCaptureStore) {
    self.configuration = configuration
    self.store = store
  }

  func process(samples: [Int16], captureAllowed: Bool, phase: String, cycle: Int) {
    guard captureAllowed else {
      flush()
      ringBuffer.removeAll(keepingCapacity: true)
      aboveMs = 0
      return
    }
    self.phase = phase
    self.cycle = cycle
    pendingSamples.append(contentsOf: samples)
    while pendingSamples.count >= 1_600 {
      let chunk = Array(pendingSamples.prefix(1_600))
      pendingSamples.removeFirst(1_600)
      processChunk(chunk)
    }
  }

  func flush() {
    if voiceActive { finalizeSegment(releaseTailMs: belowMs) }
    resetDetection()
  }

  private func processChunk(_ chunk: [Int16]) {
    let normalized = normalizedLevel(chunk)
    let chunkMs: Int64 = 100
    if !voiceActive {
      ringBuffer.append(contentsOf: chunk)
      let preRollSamples = Int(configuration.vad.preRollMs) * 16
      if ringBuffer.count > preRollSamples {
        ringBuffer.removeFirst(ringBuffer.count - preRollSamples)
      }
      aboveMs = normalized > configuration.vad.threshold ? aboveMs + chunkMs : 0
      if aboveMs >= configuration.vad.sustainMs {
        voiceActive = true
        segmentSamples = ringBuffer
        speechStartMs = max(0, Int64(segmentSamples.count) / 16 - aboveMs)
        belowMs = 0
      }
      return
    }

    segmentSamples.append(contentsOf: chunk)
    belowMs = normalized <= configuration.vad.threshold ? belowMs + chunkMs : 0
    let durationMs = Int64(segmentSamples.count) / 16
    if belowMs >= configuration.vad.releaseMs || durationMs >= configuration.vad.maxSegmentMs {
      finalizeSegment(releaseTailMs: belowMs)
      resetDetection()
    }
  }

  private func finalizeSegment(releaseTailMs: Int64) {
    guard !segmentSamples.isEmpty else { return }
    let durationMs = Int64(segmentSamples.count) / 16
    let speechEndMs = max(speechStartMs, durationMs - releaseTailMs)
    do {
      let segment = try store.store(
        samples: segmentSamples,
        configuration: configuration,
        phase: phase,
        cycle: cycle,
        speechStartMs: speechStartMs,
        speechEndMs: speechEndMs
      )
      onCaptured?(segment)
    } catch {
      onFailure?(error)
    }
  }

  private func resetDetection() {
    voiceActive = false
    aboveMs = 0
    belowMs = 0
    speechStartMs = 0
    segmentSamples.removeAll(keepingCapacity: true)
    ringBuffer.removeAll(keepingCapacity: true)
  }

  private func normalizedLevel(_ samples: [Int16]) -> Double {
    let meanSquare = samples.reduce(0.0) { partial, sample in
      let normalized = Double(sample) / Double(Int16.max)
      return partial + normalized * normalized
    } / Double(max(1, samples.count))
    let db = meanSquare > 0 ? 20 * log10(sqrt(meanSquare)) : configuration.vad.dbFloor
    let range = configuration.vad.dbCeil - configuration.vad.dbFloor
    guard range > 0 else { return 0 }
    return max(0, min(1, (db - configuration.vad.dbFloor) / range))
  }
}
