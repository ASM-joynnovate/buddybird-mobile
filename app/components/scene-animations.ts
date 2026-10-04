import { ZoomIn } from 'react-native-reanimated';

const POP_START_MS = 80;
const POP_STAGGER_MS = 70;

/**
 * 장면 요소가 작게 시작해 튀어나오는 애니메이션
 * @param order 요소가 나타나는 순서
 */
export const popIn = (order: number) => ZoomIn.springify().delay(POP_START_MS + order * POP_STAGGER_MS);
