// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // react-native 의 Text/TextInput 을 직접 쓰면 OS 글꼴 확대가 상한 없이 적용된다.
    // components/ui/app-text 래퍼가 maxFontSizeMultiplier 를 씌운다.
    files: ['app/**/*.tsx', 'components/**/*.tsx'],
    ignores: ['components/ui/app-text.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextInput'],
              message:
                "Text/TextInput 은 '@/components/ui/app-text' 에서 import 하세요. react-native 원본은 글꼴 확대 상한이 없습니다.",
            },
          ],
        },
      ],
    },
  },
]);
