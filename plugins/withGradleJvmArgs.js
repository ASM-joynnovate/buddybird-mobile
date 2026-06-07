const { withGradleProperties } = require('@expo/config-plugins');

const JVMARGS_KEY = 'org.gradle.jvmargs';
const JVMARGS_VALUE =
  '-Xmx6144m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8';
const COMMENT = ' Injected by plugins/withGradleJvmArgs.js — see docs/BUILD-AND-RELEASE.md';

/**
 * @param {Array<{ type: 'property' | 'comment' | 'empty', key?: string, value?: string }>} modResults
 * @returns {Array<{ type: 'property' | 'comment' | 'empty', key?: string, value?: string }>}
 */
function upsertJvmArgs(modResults) {
  const existingIndex = modResults.findIndex(
    (item) => item.type === 'property' && item.key === JVMARGS_KEY,
  );

  if (existingIndex >= 0) {
    const next = [...modResults];
    next[existingIndex] = { type: 'property', key: JVMARGS_KEY, value: JVMARGS_VALUE };
    return next;
  }

  return [
    ...modResults,
    { type: 'comment', value: COMMENT },
    { type: 'property', key: JVMARGS_KEY, value: JVMARGS_VALUE },
  ];
}

const withGradleJvmArgs = (config) => {
  return withGradleProperties(config, (innerConfig) => {
    innerConfig.modResults = upsertJvmArgs(innerConfig.modResults);
    return innerConfig;
  });
};

module.exports = withGradleJvmArgs;
module.exports.upsertJvmArgs = upsertJvmArgs;
module.exports.JVMARGS_KEY = JVMARGS_KEY;
module.exports.JVMARGS_VALUE = JVMARGS_VALUE;
