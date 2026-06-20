import { TrueSheet, type SheetDetent } from '@lodev09/react-native-true-sheet';
import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';

import { BuddyBirdColors, Radii } from '@/constants/theme';

interface BottomSheetProps {
  /** 부모가 소유하는 표시 상태. true → present, false → dismiss. */
  visible: boolean;
  /** 시트가 닫힐 때(드래그/스크림 탭/프로그램) 호출. 부모 visible 동기화에 사용. */
  onClose: () => void;
  children: ReactNode;
  /**
   * 시트 하단 베젤에 고정되는 영역(예: 액션 버튼). 일반 children은 iOS에서 홈 인디케이터
   * safe-area 위로 인셋되므로, 베젤까지 붙여야 하는 콘텐츠는 footer로 전달한다.
   * (safe-area 하단 패딩은 호출부에서 `insets.bottom`으로 처리)
   */
  footer?: ReactElement;
  /** 지원할 detent 목록. 기본값은 콘텐츠 높이에 맞추는 'auto' (스크롤 없이 고정). */
  detents?: SheetDetent[];
  /** 네이티브 드래그 핸들 표시 여부. */
  grabber?: boolean;
}

/**
 * 앱 공용 바텀시트. `react-native-true-sheet`를 감싸 앱 토큰(surface, Radii.sheet)을
 * 캡슐화하고, 명령형 ref 대신 부모의 `visible` 상태로 present/dismiss를 구동한다.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  footer,
  detents = ['auto'],
  grabber = true,
}: BottomSheetProps) {
  const sheet = useRef<TrueSheet>(null);
  // 실제 present 상태를 추적해 lazy-load 된(미present) 시트에 dismiss를 호출하지 않도록 가드한다.
  // (미present 시 dismiss → 네이티브가 "No sheet found with tag" 거부)
  const presentedRef = useRef(false);

  useEffect(() => {
    if (visible && !presentedRef.current) {
      presentedRef.current = true;
      void sheet.current?.present();
    } else if (!visible && presentedRef.current) {
      presentedRef.current = false;
      void sheet.current?.dismiss();
    }
  }, [visible]);

  // 시트가 스스로 닫힐 때(드래그/스크림) presentedRef를 먼저 내려, 뒤따르는 effect의 중복 dismiss를 막는다.
  function handleDidDismiss() {
    presentedRef.current = false;
    onClose();
  }

  return (
    <TrueSheet
      backgroundColor={BuddyBirdColors.surface}
      cornerRadius={Radii.sheet}
      detents={detents}
      footer={footer}
      grabber={grabber}
      onDidDismiss={handleDidDismiss}
      ref={sheet}>
      {children}
    </TrueSheet>
  );
}
