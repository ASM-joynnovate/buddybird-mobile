const { withGradleProperties } = require("expo/config-plugins")

module.exports = function withAndroidBuildMemory(config) {
  return withGradleProperties(config, (config) => {
    // Release classpath snapshots exceeded Expo's default 512 MiB metaspace.
    config.modResults = config.modResults.filter((item) => item.key !== "org.gradle.jvmargs")
    config.modResults.push({
      type: "property",
      key: "org.gradle.jvmargs",
      value: "-Xmx4096m -XX:MaxMetaspaceSize=1024m",
    })

    return config
  })
}
