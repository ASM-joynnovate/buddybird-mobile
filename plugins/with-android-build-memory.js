const { withGradleProperties } = require('expo/config-plugins');

/** Gradle 메모리 설정 플러그인 */
const withAndroidBuildMemory = (config) =>
	withGradleProperties(config, (mod) => ({
		...mod,
		modResults: [
			...mod.modResults.filter((item) => item.key !== 'org.gradle.jvmargs'),
			// 릴리스 빌드의 metaspace 부족 방지
			{ type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx4096m -XX:MaxMetaspaceSize=1024m' },
		],
	}));

module.exports = withAndroidBuildMemory;
