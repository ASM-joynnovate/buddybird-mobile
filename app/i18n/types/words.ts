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
		recordingsHint: string;
		recordingRequired: string;
		saving: string;
		uploading: string;
		processing: string;
		saveError: string;
	};
	guide: {
		word: string;
		manyRecordings: {
			title: string;
			scene: string;
			recordingOrder: string;
			report: string;
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
		empty: string;
		tooLarge: string;
		invalidFormat: string;
		recordError: string;
	};
	deleteError: string;
};
