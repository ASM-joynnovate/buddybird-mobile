const { withInfoPlist } = require("@expo/config-plugins")

module.exports = (config) =>
	withInfoPlist(config, (mod) => {
		mod.modResults.UIBackgroundModes = [
			...new Set([...(mod.modResults.UIBackgroundModes || []), "audio"]),
		]
		mod.modResults.NSMicrophoneUsageDescription ||=
			"BuddyBird uses the microphone to record your bird during learning."

		return mod
	})
