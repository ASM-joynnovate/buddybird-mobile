import Foundation
import MediaPlayer

// 잠금화면·제어센터의 재생 위젯. Android 의 MediaStyle 알림에 대응한다.
//
// 재생 위치는 시스템이 elapsed + playbackRate 로 외삽하므로 매초 갱신할 필요가 없다.
// 상태 전이와 구간 전환에서만 갱신한다.
//
// 커맨드 등록과 nowPlayingInfo 갱신은 모두 메인 스레드에서 순서대로 실행한다.
// coordinator 직렬 큐에서 등록하면 iOS 18 이 커맨드 enable 상태를 nowPlayingInfo 스냅샷
// 시점에 불일치로 굳혀, 첫 실행에서 잠금화면·제어센터 컨트롤이 회색으로 남는다.
final class SessionNowPlaying {
  // 원격 커맨드는 메인 스레드로 도착한다. 엔진 명령은 오디오 장치를 열고 닫느라 시간이
  // 걸리므로 호출자가 넘긴 핸들러 안에서 큐를 태워야 한다.
  struct Handlers {
    let play: () -> Void
    let pause: () -> Void
    let stop: () -> Void
  }

  private var registered = false

  func activate(_ handlers: Handlers) {
    guard !registered else { return }
    registered = true
    DispatchQueue.main.async {
      let center = MPRemoteCommandCenter.shared()
      center.playCommand.isEnabled = true
      center.pauseCommand.isEnabled = true
      center.togglePlayPauseCommand.isEnabled = true
      center.stopCommand.isEnabled = true
      // 세션은 단어 하나짜리이고 경과 시간은 학습 기록의 근거다 — 트랙 이동·탐색은 막는다.
      center.nextTrackCommand.isEnabled = false
      center.previousTrackCommand.isEnabled = false
      center.changePlaybackPositionCommand.isEnabled = false
      center.seekForwardCommand.isEnabled = false
      center.seekBackwardCommand.isEnabled = false
      center.skipForwardCommand.isEnabled = false
      center.skipBackwardCommand.isEnabled = false

      center.playCommand.addTarget { _ in handlers.play(); return .success }
      center.pauseCommand.addTarget { _ in handlers.pause(); return .success }
      center.togglePlayPauseCommand.addTarget { [weak self] _ in
        guard let self else { return .commandFailed }
        if self.isPlaying { handlers.pause() } else { handlers.play() }
        return .success
      }
      center.stopCommand.addTarget { _ in handlers.stop(); return .success }

      // 진단(임시, #2 해결 후 제거): 등록이 메인에서 실행됐는지 확인 — mediaremoted 의
      // supportedCommands 스냅샷 타이밍과 대조하기 위한 마커.
      NSLog("[SessionNowPlaying] remote commands registered on main thread (play/pause/toggle/stop enabled)")
    }
  }

  func update(title: String, subtitle: String, isPlaying: Bool, elapsedMs: Int64, durationMs: Int64) {
    DispatchQueue.main.async {
      self.isPlaying = isPlaying
      MPNowPlayingInfoCenter.default().nowPlayingInfo = [
        MPMediaItemPropertyTitle: title,
        MPMediaItemPropertyArtist: subtitle,
        MPMediaItemPropertyPlaybackDuration: Double(durationMs) / 1000,
        MPNowPlayingInfoPropertyElapsedPlaybackTime: Double(elapsedMs) / 1000,
        MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? 1.0 : 0.0,
        MPNowPlayingInfoPropertyIsLiveStream: false
      ]
    }
  }

  func deactivate() {
    guard registered else { return }
    registered = false
    DispatchQueue.main.async {
      self.isPlaying = false
      MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
      let center = MPRemoteCommandCenter.shared()
      center.playCommand.removeTarget(nil)
      center.pauseCommand.removeTarget(nil)
      center.togglePlayPauseCommand.removeTarget(nil)
      center.stopCommand.removeTarget(nil)
      center.playCommand.isEnabled = false
      center.pauseCommand.isEnabled = false
      center.togglePlayPauseCommand.isEnabled = false
      center.stopCommand.isEnabled = false
    }
  }

  private var isPlaying = false
}
