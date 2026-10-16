Pod::Spec.new do |s|
  s.name           = 'FrameCapture'
  s.version        = '0.0.1'
  s.summary        = 'Checks the WebRTC camera track for a parrot and keeps a rolling video buffer'
  s.author         = 'BuddyBird'
  s.homepage       = 'https://github.com/ASM-joynnovate/buddybird-mobile'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # ProcessorProvider 사용에 필요
  s.dependency 'react-native-webrtc'
  # 1.0.0은 miniaudio 심볼이 중복됨
  s.dependency 'MediaPipeTasksVision', '0.10.35'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = 'ios/**/*.{h,m,swift}'
  s.resources = 'assets/efficientdet_lite2.tflite'
end
