import { createLucideIcon } from 'lucide-react-native';

/** 원 없는 물음표 아이콘 */
const QuestionMarkIcon = createLucideIcon('question-mark', [
	['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', key: 'question-mark-curve' }],
	['path', { d: 'M12 17h.01', key: 'question-mark-dot' }],
]);

export default QuestionMarkIcon;
