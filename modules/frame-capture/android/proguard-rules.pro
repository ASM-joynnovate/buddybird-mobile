# MediaPipe issue 6088의 keep 규칙
-keep class com.google.mediapipe.tasks.** { *; }
-keep class com.google.protobuf.** { *; }
-keepclassmembers class * extends com.google.protobuf.GeneratedMessageLite {
    <fields>;
}
-dontwarn com.google.mediapipe.**
-dontwarn com.google.protobuf.**

# MediaPipe framework/proguard.pgcfg 규칙
-keep public interface com.google.mediapipe.framework.* {
  public *;
}
-keep public class com.google.mediapipe.framework.Packet {
  public static *** create(***);
  public long getNativeHandle();
  public void release();
}
-keep public class com.google.mediapipe.framework.PacketCreator {
  *** releaseWithSyncToken(...);
}
-keep public class com.google.mediapipe.framework.MediaPipeException {
  <init>(int, byte[]);
}
-keep class com.google.mediapipe.framework.ProtoUtil$SerializedMessage { *; }
