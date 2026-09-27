import type { CommonMessages } from "@/i18n/types/common"

export const common: CommonMessages = {
	mascot: "Buddy mascot",
	cancel: "Cancel",
	save: "Save",
	back: "Back",
	retry: "Try again",
	close: "Close",
	select: "Choose",
	unknown: "Unknown",
	tabs: {
		home: "Home",
		words: "Words",
		report: "Report",
		profile: "Profile",
	},
	help: "Help",
	helpClose: "Close help",
	skip: "Skip",
	next: "Next",
	start: "Start",
	dontShowAgain: "Don't show again",
	step: "Step {{current}} of {{total}}",
	offline: "You're offline. We'll reload once you're connected again.",
	loadError: "We couldn't load this. Check your connection and try again.",
	saveErrorKept: "We couldn't save. Your input is still here, so please try again.",
	illustration: "Illustration of {{scene}}",
	phases: {
		learning: "Learning",
		rest: "Rest",
		stress_care: "Stress care",
		sleeping: "Sleep time",
	},
	sound: {
		play: "Play sound detected at {{time}}",
		stop: "Stop playback",
		expired: "This sound is past its storage period",
		playError: "We couldn't play the sound. Tap play again.",
		shareError: "We couldn't share the sound. Please try again.",
		share: "Long press to share the sound",
	},
	permission: {
		title: "{{name}} access needed",
		openSettings: "Open Settings",
		microphone: {
			name: "Microphone",
			reason: "BuddyBird needs the microphone to record words and your parrot's sounds.",
		},
		notifications: {
			name: "Notification",
			reason: "BuddyBird needs notifications to send you learning updates.",
		},
		photos: {
			name: "Photo",
			reason: "BuddyBird needs photo access to choose a profile picture.",
		},
		camera: {
			name: "Camera",
			reason: "BuddyBird needs the camera to take a profile picture.",
		},
	},
	confirmDelete: {
		title: "Delete {{name}}",
		message: "This can't be undone.",
		confirm: "Delete",
	},
	time: {
		hour: "h",
		minute: "m",
		hourPicker: "Choose the hour for {{label}}",
		minutePicker: "Choose the minute for {{label}}",
	},
}
