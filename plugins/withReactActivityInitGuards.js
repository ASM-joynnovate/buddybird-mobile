const { withMainActivity } = require('@expo/config-plugins');

const IMPORT_LINE = 'import android.view.KeyEvent';
const CLASS_MARKER = 'class MainActivity : ReactActivity() {';
const GUARD_MARKER = '// ReactActivityDelegate is nullable while Expo dev launcher delays app loading.';

const GUARD_BLOCK = `
  ${GUARD_MARKER}
  override fun onUserLeaveHint() {
    if (reactDelegate == null) return
    super.onUserLeaveHint()
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    if (reactDelegate == null) return false
    return super.onKeyDown(keyCode, event)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    if (reactDelegate == null) return false
    return super.onKeyUp(keyCode, event)
  }

  override fun onKeyLongPress(keyCode: Int, event: KeyEvent): Boolean {
    if (reactDelegate == null) return false
    return super.onKeyLongPress(keyCode, event)
  }
`;

function patchMainActivityContents(contents) {
  if (contents.includes(GUARD_MARKER)) {
    return { contents, changed: false };
  }
  if (!contents.includes(CLASS_MARKER)) {
    throw new Error('[withReactActivityInitGuards] MainActivity class marker was not found.');
  }

  let next = contents;
  if (!next.includes(IMPORT_LINE)) {
    next = next.replace('import android.os.Bundle', `import android.os.Bundle\n${IMPORT_LINE}`);
  }
  next = next.replace(CLASS_MARKER, `${CLASS_MARKER}${GUARD_BLOCK}`);
  return { contents: next, changed: true };
}

const withReactActivityInitGuards = (config) => {
  return withMainActivity(config, (innerConfig) => {
    const patched = patchMainActivityContents(innerConfig.modResults.contents);
    innerConfig.modResults.contents = patched.contents;
    return innerConfig;
  });
};

module.exports = withReactActivityInitGuards;
module.exports.patchMainActivityContents = patchMainActivityContents;
