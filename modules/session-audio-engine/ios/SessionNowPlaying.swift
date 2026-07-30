import Foundation
import MediaPlayer
import UIKit

// 잠금화면·제어센터의 재생 위젯. Android 의 MediaStyle 알림에 대응한다.
//
// 재생 위치는 시스템이 elapsed + playbackRate 로 외삽하므로 매초 갱신할 필요가 없다.
// 상태 전이와 구간 전환에서만 갱신한다.
final class SessionNowPlaying {
  // 원격 커맨드는 메인 스레드에서 도착한다. 엔진 명령은 오디오 장치를 열고 닫느라 시간이
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

    // 최신 iOS 는 MPRemoteCommandCenter 타깃 등록만으로 원격 컨트롤을 켜지만, 콜드/첫 실행에서는
    // 앱이 Now Playing 소스로 등록되지 않아 잠금화면 컨트롤이 회색으로 남는 경우가 있다.
    // 명시 호출로 첫 실행부터 확실히 수신하게 한다. (UIApplication 은 메인 스레드 전용)
    DispatchQueue.main.async {
      UIApplication.shared.beginReceivingRemoteControlEvents()
    }
  }

  func update(title: String, subtitle: String, isPlaying: Bool, elapsedMs: Int64, durationMs: Int64) {
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

  func deactivate() {
    guard registered else { return }
    registered = false
    isPlaying = false
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
    DispatchQueue.main.async {
      UIApplication.shared.endReceivingRemoteControlEvents()
    }
  }

  private var isPlaying = false
}
