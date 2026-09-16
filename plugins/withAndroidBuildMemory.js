const { withGradleProperties } = require("expo/config-plugins")

module.exports = function withAndroidBuildMemory(config) {
  return withGradleProperties(config, (mod) => {
    // Release classpath snapshots exceeded Expo's default 512 MiB metaspace.
    mod.modResults = mod.modResults.filter((item) => item.key !== "org.gradle.jvmargs")
    mod.modResults.push({
      type: "property",
      key: "org.gradle.jvmargs",
      value: "-Xmx4096m -XX:MaxMetaspaceSize=1024m",
    })

    return mod
  })
}
