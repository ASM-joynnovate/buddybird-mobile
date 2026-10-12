Pod::Spec.new do |s|
  s.name           = 'FrameCapture'
  s.version        = '0.0.1'
  s.summary        = 'Saves a frame from the WebRTC camera track at a fixed interval'
  s.author         = 'BuddyBird'
  s.homepage       = 'https://github.com/ASM-joynnovate/buddybird-mobile'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # 송출 중인 카메라 영상에 프레임 처리기를 끼우기 위해 react-native-webrtc의 확장 지점을 사용
  s.dependency 'react-native-webrtc'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,swift}'
end
