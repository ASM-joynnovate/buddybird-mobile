const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

// SVG 파일을 컴포넌트로 가져옴
config.transformer = {
	...config.transformer,
	babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
	...config.resolver,
	assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
	sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = config;
