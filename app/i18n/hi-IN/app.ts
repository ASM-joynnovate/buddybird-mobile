import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: 'ऐप तैयार हो रहा है',
	},
	startupError: {
		title: 'ऐप शुरू नहीं हो सका',
		message: 'इंटरनेट कनेक्शन जाँचें और फिर से कोशिश करें।',
	},
	feedback: {
		sentMessage: 'आपका कीमती फ़ीडबैक हम तक पहुँच गया है। इससे हम BuddyBird को और बेहतर बनाएँगे।',
		retry: 'फिर से भेजें',
		promptTitle: 'हमें अपनी राय बताएँ',
		promptMessage: 'BuddyBird इस्तेमाल करते हुए आपको जो अच्छा लगा या आप जो चाहते हैं, खुलकर बताएँ। इससे हमें बहुत मदद मिलती है!',
		write: 'फ़ीडबैक दें',
		title: 'फ़ीडबैक भेजें',
		placeholder: 'क्या बेहतर हो सकता है, कहाँ परेशानी हुई या कौन-सी सुविधा चाहिए, खुलकर लिखें।',
		privacy: '⚠ नाम या फ़ोन नंबर जैसी निजी जानकारी न डालें।',
		send: 'भेजें',
		sentTitle: 'धन्यवाद!',
		sendError: 'फ़ीडबैक नहीं भेजा जा सका। आपने जो लिखा है वह सुरक्षित है, कनेक्शन जाँचकर फिर से कोशिश करें।',
	},
	update: {
		title: 'अपडेट उपलब्ध है',
		forcedTitle: 'अपडेट करना ज़रूरी है',
		message: 'BuddyBird का {{version}} वर्शन उपलब्ध है।',
		forcedMessage: 'ऐप इस्तेमाल करते रहने के लिए {{version}} वर्शन पर अपडेट करें।',
		forcedMessageWithoutVersion: 'ऐप इस्तेमाल करते रहने के लिए इसे अपडेट करें।',
		accept: 'अपडेट करें',
		openStoreError: 'स्टोर नहीं खोला जा सका। फिर से कोशिश करें।',
	},
};
