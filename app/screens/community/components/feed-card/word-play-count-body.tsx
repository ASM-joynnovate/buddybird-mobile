import { Text } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import { Trans, useTranslation } from 'react-i18next';

import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import FeedCardMilestoneBody, { milestoneStyles } from '@/screens/community/components/feed-card/milestone-body';
import { colors, font } from '@/theme';

const ART_TEXT_WIDTH = 100;
const ART_TEXT_MAX_SIZE = 22;
const GLYPH_WIDTH_RATIO = 0.62;

interface Props {
	feedItem: FeedItem;
}

/**
 * 단어를 들려준 횟수 달성 피드 내용 컴포넌트
 * @param feedItem 피드 항목
 */
const FeedCardWordPlayCountBody = ({ feedItem }: Props) => {
	const { t } = useTranslation();

	const count = feedItem.threshold ?? 0;
	const countText = t('community.feed.artCount', { count });
	const countTextSize = Math.min(ART_TEXT_MAX_SIZE, ART_TEXT_WIDTH / (countText.length * GLYPH_WIDTH_RATIO));

	return (
		<FeedCardMilestoneBody
			message=<Trans
				i18nKey="community.feed.wordPlayCount"
				values={{ word: feedItem.word_name ?? '', count }}
				components={{ b: <Text style={milestoneStyles.emphasis} /> }}
			/>
			art=<Svg width={76} height={67} viewBox="0 0 104 92" accessible={false}>
				<Circle cx={52} cy={34} r={30} fill={colors.orangeDark} />
				<Circle cx={52} cy={31} r={30} fill={colors.orange} />
				<Path
					d="M38 24h8l10-8v30l-10-8h-8Z"
					fill={colors.onFilled}
					stroke={colors.onFilled}
					strokeWidth={3}
					strokeLinejoin="round"
				/>
				<Path
					d="M62 22c4 5 4 13 0 18M68 17c7 8 7 20 0 28"
					fill="none"
					stroke={colors.onFilled}
					strokeWidth={3.5}
					strokeLinecap="round"
				/>
				<SvgText
					x={52}
					y={88}
					textAnchor="middle"
					fontFamily={font.black}
					fontSize={countTextSize}
					fill={colors.text}
				>
					{countText}
				</SvgText>
			</Svg>
		/>
	);
};

export default FeedCardWordPlayCountBody;
