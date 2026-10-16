# MediaPipe issue 6088의 keep 규칙
-keep class com.google.mediapipe.tasks.** { *; }
-keep class com.google.protobuf.** { *; }
-keepclassmembers class * extends com.google.protobuf.GeneratedMessageLite {
    <fields>;
}
-dontwarn com.google.mediapipe.**
-dontwarn com.google.protobuf.**
