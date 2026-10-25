# BuddyBird mobile 코드 규칙

## 확인

- 수정을 마치면 `yarn check`를 통과시킵니다.
- 포맷 및 import 순서는 `.oxfmtrc.jsonc`, lint는 `oxlint.config.mts`, 폴더 사이 의존은 `.dependency-cruiser.cjs`가 정합니다.
- 화면, 제스처, 애니메이션 변경은 시뮬레이터나 기기에서 실행해 확인합니다.
- 테스트 파일은 만들지 않습니다.

## 폴더

- 화면 코드는 `app/screens/<기능>/`에 두고, 두 기능 이상이 쓰는 코드만 `app/components`, `app/hooks`, `app/utils`, `app/types`로 올립니다.
- 폴더 하나가 컴포넌트 하나면 `index.tsx`가 본체이고, 나머지 파일의 컴포넌트 이름은 `<본체 이름><역할>`입니다.
- 파일 하나에 컴포넌트 하나를 둡니다. SVG 조각을 모은 `components/mascot/artwork.tsx`만 예외입니다.
- 여러 파일이 쓰는 타입은 `app/types`, 한 파일에서만 쓰는 타입은 그 파일에 둡니다.
- 컴포넌트 Props 및 `ReturnType`으로 만든 타입은 여러 파일이 써도 정의한 파일에 둡니다.

## 컴포넌트 및 Hook 안의 순서

1. 라이브러리 Hook: `useTranslation`, `useNavigation`, `useSafeAreaInsets`
2. 화면 상태: `useState`, `useRef`, `useSharedValue`
3. 조회 Hook
4. 저장 Hook
5. 스토어 값, 그 뒤에 스토어 액션
6. 앱의 커스텀 Hook
7. 계산 값
8. effect
9. 핸들러
10. return

뒤 순서의 값을 인자로 받는 Hook이 있으면 그 값을 Hook 바로 앞에 둡니다.
역할이 다른 묶음 사이에는 빈 줄을 둡니다.
화면 상태는 `useState`, `useRef`, `useSharedValue`처럼 Hook 종류마다 모으고 종류 사이에 빈 줄을 둡니다.

## 이름

- 이름만 보고 담긴 값이나 하는 일을 알 수 있게 짓습니다. `items`, `rows`, `data`, `run`, `apply`처럼 뜻이 넓은 이름 대신 `logItems`, `runWithPermission`처럼 대상을 붙입니다.
- 불리언은 `isLandscape`, `canGoBack`, `hasSessions`, `shouldPause`, `showKakao`처럼 `is`, `can`, `has`, `should`, `show`로 시작하거나 `sessionFinishing`, `infoVisible`처럼 대상 뒤에 상태를 붙입니다. 컴포넌트 prop도 같습니다.
- `disabled`, `visible`, `selected`, `checked`, `loading`, `value`처럼 React Native 기본 컴포넌트와 같은 뜻의 prop은 그 이름을 그대로 씁니다.
- 컴포넌트나 타입이 다루는 대상이 하나면 대상 이름을 붙이지 않습니다. 예: `Dialog`의 `visible`, `PlayButton`의 `playing`
- 컴포넌트가 이벤트에 넘기는 함수는 `handle` 뒤에 하는 일을 붙이고 return 앞에 둡니다. 함수 하나만 호출하는 한 줄 함수는 JSX에 둡니다.
- 콜백 prop은 `on`으로 시작합니다.
- `try/catch`의 오류 인자는 `e`, `onError` 및 `.catch` 콜백의 오류 인자는 `error`입니다. catch 안의 catch는 바깥 `e`와 겹치지 않게 `signOutError`처럼 대상 뒤에 `Error`를 붙입니다.
- `useRef` 값은 `Ref`로 끝나고, setState 갱신 함수의 인자는 `prev`입니다.

## 주석

- 컴포넌트, Hook, 이름 있는 함수, effect, 스토어 액션에 한국어 JSDoc을 한 줄 20자 안팎으로 답니다. 예: `/** 단어 목록 조회 Hook */`
- 컴포넌트 JSDoc에는 prop마다 `@param`을 적습니다.
- 주석 하나에는 핵심 하나만 적고, 동작은 변경, 표시, 선택, 측정, 카운트 같은 기술 용어로 씁니다.
- `types`, `apis`, `components/ui`, mock, 상수, 스타일 변수에는 주석을 달지 않습니다.

## 값

- 상수는 리터럴로 적고 다른 상수에서 계산하지 않습니다.
- 1초 이상 시간은 `app/config/units.ts`의 `SECOND` 등을 곱해 `3 * SECOND`로, 1초보다 짧은 시간은 ms 숫자로 적습니다.
- 정책 값은 `app/config/policy.ts`, 환경 값은 `app/config/env.ts`, 디자인 값은 `app/theme`에 둡니다.

## 서버 요청

- 요청 함수는 `app/apis/<도메인>.ts`에 두고, 이름은 HTTP 메서드로 시작하며 인자는 객체 하나입니다.
- 응답은 `app/types/apis/<도메인>.ts`의 zod 스키마로 검사합니다.
- 조회는 `getXOptions` 옵션 함수 및 `useGetX` Hook 한 쌍으로 만들고, 쿼리 키는 `app/hooks/apis/keys/<도메인>.ts`에 둡니다.
- suspense 없이 조회하는 곳은 같은 파일에 `useGetXQuery` Hook을 추가해 사용합니다. 화면에서 `useQuery`를 직접 호출하지 않습니다.
- 저장은 서버 요청 하나에 저장 Hook 하나이고, 화면에서 `mutate(variables, { onSuccess })`로 실행합니다. 여러 요청을 잇는 흐름 및 컴포넌트가 사라진 뒤에 결과를 받는 요청만 `mutateAsync`를 사용합니다.
- 입력 필드와 관계없는 요청 실패는 `Toast`로 표시합니다. 다이얼로그 안에서는 `dialogToasterId`로 그 위에 표시합니다.
- 사용자가 할 일이 없는 실패는 `reportError`로 보고만 합니다.
- 자세한 계층 및 규칙은 `docs/api-client.md`에 있습니다.

## 상태

- 서버 응답은 TanStack Query 캐시에만 둡니다.
- 스토어는 도메인 하나에 하나이고, 값 및 액션을 `useXStore((state) => state.x)`로 하나씩 선택합니다.
- 스토어 액션은 `set((state) => ({ ...state, ... }))`로 새 객체를 만듭니다.
- 기기 저장값의 키 및 migrate 규칙은 `docs/mmkv-key-design.md`에 있습니다.

## React

- 조건부 JSX는 `{조건 && <X />}`로 쓰고, 글자나 숫자 조건에는 `!!`를 붙입니다.
- `useCallback`은 Hook에 넘기거나 effect 의존 배열에 들어가는 함수에만 사용합니다.
- 계산할 수 있는 값은 상태로 두지 않고 렌더링 중에 계산합니다.
- 화면 문구는 `t('words.editor.addTitle')`처럼 번역 키로 쓰고, 다섯 언어 파일에 모두 추가합니다.
