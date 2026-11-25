import { useWindowDimensions } from 'react-native';

/** 가로 모드 여부를 반환하는 Hook */
const useIsLandscape = () => {
	const { width, height } = useWindowDimensions();

	return width > height;
};

export default useIsLandscape;
