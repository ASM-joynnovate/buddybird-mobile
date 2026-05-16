const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER_LINE = '$RNFirebaseAsStaticFramework = true';
const SECTION_HEADER = '# Injected by plugins/withFirebaseStaticPodfile.js';

function patchPodfileContents(contents) {
  if (contents.includes(MARKER_LINE)) {
    return { contents, changed: false };
  }

  const block = `${SECTION_HEADER}\n${MARKER_LINE}\n\n`;
  return { contents: block + contents, changed: true };
}

const withFirebaseStaticPodfile = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (innerConfig) => {
      const podfilePath = path.join(
        innerConfig.modRequest.platformProjectRoot,
        'Podfile',
      );

      if (!fs.existsSync(podfilePath)) {
        throw new Error(
          `[withFirebaseStaticPodfile] Podfile not found at ${podfilePath}. ` +
            'Run `npx expo prebuild` first or verify the iOS project was generated.',
        );
      }

      const original = fs.readFileSync(podfilePath, 'utf8');
      const { contents, changed } = patchPodfileContents(original);

      if (changed) {
        fs.writeFileSync(podfilePath, contents, 'utf8');
      }

      return innerConfig;
    },
  ]);
};

module.exports = withFirebaseStaticPodfile;
module.exports.patchPodfileContents = patchPodfileContents;
