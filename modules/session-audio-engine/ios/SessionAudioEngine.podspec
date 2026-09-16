Pod::Spec.new do |s|
  s.name = 'SessionAudioEngine'
  s.version = '1.0.0'
  s.summary = 'BuddyBird native learning audio engine'
  s.description = s.summary
  s.license = { :type => 'Proprietary' }
  s.author = 'BuddyBird'
  s.homepage = 'https://buddybird.app'
  s.platforms = { :ios => '15.1' }
  s.swift_version = '5.9'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation', 'MediaPlayer'
  s.source_files = '**/*.swift'
end
