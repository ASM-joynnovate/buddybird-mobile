import { type RefObject, useEffect } from 'react';

import type { View } from 'react-native';

import { useGetMeQuery } from '@/hooks/apis/users';

import { useAuthStore } from '@/stores/auth';
import { useReportStore } from '@/stores/report';

import CommunityGate from '@/components/community-gate';

interface Props {
	blurTarget: RefObject<View | null>;
}

/**
 * 피드 공유 전 로그인 및 닉네임 입력 컴포넌트
 * @param blurTarget Android에서 흐리게 할 화면
 */
const SessionDetailFeedShare = ({ blurTarget }: Props) => {
	const { data: meData } = useGetMeQuery();

	const isAnonymous = useAuthStore((state) => state.isAnonymous);
	const pendingFeedShareSoundId = useReportStore((state) => state.pendingFeedShareSoundId);

	const setPendingFeedShareSoundId = useReportStore((state) => state.setPendingFeedShareSoundId);

	const gateShown = pendingFeedShareSoundId !== null && (isAnonymous || meData?.nickname === null);

	/** 화면을 닫으면 기다리던 피드 공유 취소 */
	useEffect(() => () => setPendingFeedShareSoundId(null), [setPendingFeedShareSoundId]);

	if (!gateShown) {
		return null;
	}

	return <CommunityGate blurTarget={blurTarget} />;
};

export default SessionDetailFeedShare;
