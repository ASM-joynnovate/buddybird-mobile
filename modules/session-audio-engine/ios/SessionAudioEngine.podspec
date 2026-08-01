require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SessionAudioEngine'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = 'Joynnovate'
  s.homepage       = 'https://github.com/ASM-joynnovate/buddybird-mobile'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # MediaPlayer: 잠금화면·제어센터의 Now Playing 정보와 원격 재생 커맨드.
  s.frameworks = 'AVFoundation', 'MediaPlayer'
  s.source_files = '**/*.{h,m,swift}'
end
