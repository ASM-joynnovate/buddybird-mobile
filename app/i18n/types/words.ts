export type WordsMessages = {
	list: {
		title: string;
		add: string;
		empty: string;
		play: string;
		delete: string;
	};
	editor: {
		addTitle: string;
		editTitle: string;
		delete: string;
		name: string;
		nameHint: string;
		nameRequired: string;
		recordings: string;
		openGuide: string;
		recordingName: string;
		play: string;
		deleteRecording: string;
		addRecording: string;
		recordingTips: {
			intro: string;
			goodLabel: string;
			goodNote: string;
			badLabel: string;
			otherNote: string;
			repeatNote: string;
			recommended: string;
			label: string;
		};
		recordingRequired: string;
		saving: string;
		uploading: string;
		processing: string;
		saveError: string;
	};
	guide: {
		word: string;
		otherWord: string;
		anotherWord: string;
		sameWord: {
			title: string;
			scene: string;
			goodLabel: string;
			badLabel: string;
		};
		quiet: {
			title: string;
			scene: string;
			recording: string;
		};
		distance: {
			title: string;
			scene: string;
		};
		highVoice: {
			title: string;
			scene: string;
			speech: string;
		};
	};
	recorder: {
		done: string;
		start: string;
		stop: string;
		play: string;
		rerecord: string;
		onceInstruction: string;
		empty: string;
		tooLarge: string;
		invalidFormat: string;
		recordError: string;
	};
	deleteError: string;
};
