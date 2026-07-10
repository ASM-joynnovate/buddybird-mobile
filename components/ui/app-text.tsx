import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

// OS 글꼴 확대를 존중하되 상한을 둔다. 이 앱의 카드·버튼·배지는 고정 높이라
// 무제한 확대를 허용하면 글자가 잘린다. 완전히 끄면(allowFontScaling=false)
// 저시력 사용자가 키운 글꼴이 이 앱에서만 무시되므로, 배수 상한으로 절충한다.
//
// 정책을 바꾸려면 이 상수 하나만 고치면 된다.
export const MAX_FONT_SIZE_MULTIPLIER = 1.2;

// react-native 의 Text/TextInput 직접 import 는 eslint no-restricted-imports 로 막혀 있다.
// 화면·컴포넌트는 반드시 이 래퍼를 쓴다.
export function Text({ maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER, ...rest }: TextProps) {
  return <RNText maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}

export function TextInput({
  maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER,
  ...rest
}: TextInputProps) {
  return <RNTextInput maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}
