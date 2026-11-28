import type { ComponentType } from 'react';

import type { SvgProps } from 'react-native-svg';

import HelloIcon from '@assets/images/icons/words/01-hello.svg';
import HiIcon from '@assets/images/icons/words/02-hi.svg';
import LoveYouIcon from '@assets/images/icons/words/03-love-you.svg';
import HeyIcon from '@assets/images/icons/words/04-hey.svg';
import HiThereIcon from '@assets/images/icons/words/05-hi-there.svg';
import WellDoneIcon from '@assets/images/icons/words/06-well-done.svg';
import ThankYouIcon from '@assets/images/icons/words/07-thank-you.svg';
import GoodIcon from '@assets/images/icons/words/08-good.svg';
import BestIcon from '@assets/images/icons/words/09-best.svg';
import CongratsIcon from '@assets/images/icons/words/10-congrats.svg';
import WhatsUpIcon from '@assets/images/icons/words/11-whats-up.svg';
import ListenIcon from '@assets/images/icons/words/12-listen.svg';
import RepeatIcon from '@assets/images/icons/words/13-repeat.svg';
import SingIcon from '@assets/images/icons/words/14-sing.svg';
import StartIcon from '@assets/images/icons/words/15-start.svg';
import RestIcon from '@assets/images/icons/words/16-rest.svg';
import GoodMorningIcon from '@assets/images/icons/words/17-good-morning.svg';
import YummyIcon from '@assets/images/icons/words/18-yummy.svg';
import LetsPlayIcon from '@assets/images/icons/words/19-lets-play.svg';
import SeeYouIcon from '@assets/images/icons/words/20-see-you.svg';

export const wordIcons: ComponentType<SvgProps>[] = [
	HelloIcon,
	HiIcon,
	LoveYouIcon,
	HeyIcon,
	HiThereIcon,
	WellDoneIcon,
	ThankYouIcon,
	GoodIcon,
	BestIcon,
	CongratsIcon,
	WhatsUpIcon,
	ListenIcon,
	RepeatIcon,
	SingIcon,
	StartIcon,
	RestIcon,
	GoodMorningIcon,
	YummyIcon,
	LetsPlayIcon,
	SeeYouIcon,
];

/** 단어 id 해시 계산 */
const getWordIdHash = (wordId: string) => {
	let hash = 0;
	for (const char of wordId) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}
	return hash;
};

/** 단어마다 겹치지 않는 아이콘 번호 선택 */
export const getWordIconIndexes = (wordIds: string[]) => {
	const usedIndexes = new Set<number>();

	return wordIds.map((wordId) => {
		if (usedIndexes.size === wordIcons.length) {
			usedIndexes.clear();
		}

		let iconIndex = getWordIdHash(wordId) % wordIcons.length;
		while (usedIndexes.has(iconIndex)) {
			iconIndex = (iconIndex + 1) % wordIcons.length;
		}
		usedIndexes.add(iconIndex);

		return iconIndex;
	});
};
