import type { TrainingGoalId } from '@/features/profile/profile-types';

export const SUPPORTED_LOCALES = ['ko', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

interface TrainingGoalCopy {
  label: string;
  sample: string;
}

interface PresetWordTemplateCopy {
  id: string;
  label: string;
  phrase: string;
  description: string;
}

interface SessionTemplateCopy {
  id: string;
  label: string;
  description: string;
  totalDurationSeconds: number;
  learningDurationSeconds: number;
  restDurationSeconds: number;
}

interface AppCopy {
  common: {
    add: string;
    cancel: string;
    customInput: string;
    directInput: string;
    next: string;
    save: string;
    saving: string;
    selected: string;
    start: string;
    age: {
      months: string;
      years: string;
      yearsMonths: string;
    };
    duration: {
      minutes: string;
      hours: string;
      hoursMinutes: string;
    };
    languageNames: Record<AppLocale, string>;
  };
  tabs: {
    home: string;
    profile: string;
  };
  validation: {
    nameRequired: string;
    speciesRequired: string;
    ageInvalid: string;
    goalRequired: string;
  };
  onboarding: {
    welcome: {
      kicker: string;
      title: string;
      body: string;
      cta: string;
    };
    profile: {
      kicker: string;
      title: string;
      body: string;
      nameLabel: string;
      namePlaceholder: string;
      speciesLabel: string;
      speciesPlaceholder: string;
      ageLabel: string;
      minusMonth: string;
      plusMonth: string;
    };
    goals: {
      kicker: string;
      title: string;
      body: string;
      fallbackError: string;
      saveError: string;
      cta: string;
    };
  };
  home: {
    kicker: string;
    greeting: string;
    body: string;
    sessionTitle: string;
    phasePill: string;
    sessionBody: string;
    disabledCta: string;
    startSessionCta: string;
    totalTrainingTime: string;
    trainingGoals: string;
    goalCount: string;
    singleProfileTitle: string;
    singleProfileBody: string;
    profileLink: string;
    presetPreviewTitle: string;
    sessionTemplateTitle: string;
  };
  audio: {
    waveformPreviewLabel: string;
  };
  sessionSetup: {
    kicker: string;
    title: string;
    body: string;
    sourceLabel: string;
    presetSource: string;
    recordingSource: string;
    presetLabel: string;
    recordingLabel: string;
    recordingBody: string;
    startRecording: string;
    stopRecording: string;
    rerecord: string;
    continueCta: string;
    confirmAudioTitle: string;
    sessionTemplateLabel: string;
    saveCta: string;
    saveError: string;
    savedMessage: string;
    presetPreviewDisabledTitle: string;
    presetPreviewDisabledBody: string;
    recordedStatus: string;
    recordingStatus: string;
    pitchAppliedStatus: string;
    pitchAppliedBody: string;
    previewCta: string;
    previewDisabledCta: string;
    selectAudioError: string;
    selectTemplateError: string;
    storeLoading: string;
    zeroDurationError: string;
  };
  recording: {
    permissionDenied: string;
    startFailed: string;
    saveFailed: string;
    tooShort: string;
  };
  audioErrors: {
    previewFailed: string;
  };
  wordCreate: {
    title: string;
    step1Recording: string;
    step2Label: string;
    step3Tag: string;
    save: string;
    cancel: string;
    labelPlaceholder: string;
  };
  wordEdit: {
    title: string;
    delete: string;
    confirmDelete: string;
  };
  wordLibrary: {
    empty: string;
    emptyHint: string;
    editAction: string;
    deleteAction: string;
    sourcePreset: string;
    sourceRecording: string;
  };
  sessionSetupExtra: {
    emptyLibrary: string;
  };
  profile: {
    kicker: string;
    title: string;
    body: string;
    editCta: string;
    nameLabel: string;
    namePlaceholder: string;
    speciesLabel: string;
    speciesPlaceholder: string;
    saveError: string;
    futureTitle: string;
    futureBody: string;
    languageTitle: string;
    languageBody: string;
    languageSaveError: string;
    avatarSelect: string;
    avatarError: string;
    cardGoalCount: string;
  };
  profileOptions: {
    speciesOptions: Record<string, string>;
    trainingGoals: Record<TrainingGoalId, TrainingGoalCopy>;
  };
  trainingTemplates: {
    presetWords: PresetWordTemplateCopy[];
    sessions: SessionTemplateCopy[];
  };
}

export const translations: Record<AppLocale, AppCopy> = {
  ko: {
    common: {
      add: '추가',
      cancel: '취소',
      customInput: '+ 직접입력',
      directInput: '직접입력',
      next: '다음',
      save: '저장',
      saving: '저장 중...',
      selected: '선택',
      start: '시작하기',
      age: {
        months: '%{months}개월',
        years: '%{years}년',
        yearsMonths: '%{years}년 %{months}개월',
      },
      duration: {
        minutes: '%{minutes}분',
        hours: '%{hours}시간',
        hoursMinutes: '%{hours}시간 %{minutes}분',
      },
      languageNames: {
        ko: '한국어',
        en: 'English',
      },
    },
    tabs: {
      home: '홈',
      profile: '프로필',
    },
    validation: {
      nameRequired: '반려조 이름을 입력해 주세요.',
      speciesRequired: '반려조 종류를 선택하거나 직접 입력해 주세요.',
      ageInvalid: '나이는 1개월부터 10년까지 선택할 수 있어요.',
      goalRequired: '학습 목표를 하나 이상 선택해 주세요.',
    },
    onboarding: {
      welcome: {
        kicker: 'STEP 01',
        title: '앵무새와\n더 깊이 대화하세요',
        body: 'AI가 당신의 목소리를 앵무새가 가장 잘 듣는 1–4 kHz 고주파로 변환해 들려줘요.',
        cta: '시작하기',
      },
      profile: {
        kicker: 'STEP 02',
        title: '반려조 프로필을\n알려주세요',
        body: 'MVP에서는 한 마리만 등록해 홈과 학습 기록을 연결해요.',
        nameLabel: '이름',
        namePlaceholder: '예: 망고',
        speciesLabel: '종',
        speciesPlaceholder: '종을 입력해 주세요',
        ageLabel: '나이',
        minusMonth: '- 1개월',
        plusMonth: '+ 1개월',
      },
      goals: {
        kicker: 'STEP 03',
        title: '처음 들려줄 말을\n골라주세요',
        body: '선택한 목표는 홈에서 바로 이어갈 수 있도록 연결돼요.',
        fallbackError: '프로필 정보를 다시 확인해 주세요.',
        saveError: '프로필 저장에 실패했어요. 잠시 후 다시 시도해 주세요.',
        cta: '시작하기 (%{count})',
      },
    },
    home: {
      kicker: 'TODAY',
      greeting: '안녕하세요,\n%{name}와 함께',
      body: '오늘도 짧고 반복적인 소리 루틴으로 반려조의 귀를 깨워볼까요?',
      sessionTitle: '새 세션 시작',
      phasePill: '세션 설정',
      sessionBody: '기본 단어를 고르거나 직접 녹음해 오늘 들려줄 학습 오디오를 정해요.',
      disabledCta: '세션 설정 준비 중',
      startSessionCta: '세션 설정하기',
      totalTrainingTime: '누적 학습 시간',
      trainingGoals: '학습 목표',
      goalCount: '%{count}개',
      singleProfileTitle: 'MVP 단일 프로필',
      singleProfileBody: '현재는 한 마리 프로필만 지원해요. 추가 등록과 삭제는 추후 제공 예정입니다.',
      profileLink: '프로필 확인하기',
      presetPreviewTitle: '기본 단어',
      sessionTemplateTitle: '추천 세션',
    },
    audio: {
      waveformPreviewLabel: '1–4 kHz 음성 파형 미리보기',
    },
    sessionSetup: {
      kicker: 'SESSION SETUP',
      title: '오늘 들려줄 소리를\n먼저 정해요',
      body: '짧은 단어를 고르거나 직접 녹음한 뒤, 앵무새가 알아차리기 쉬운 높은 톤 메타데이터를 적용해요.',
      sourceLabel: '오디오 소스',
      presetSource: '기본 단어',
      recordingSource: '직접 녹음',
      presetLabel: '기본 단어 선택',
      recordingLabel: '녹음하기',
      recordingBody: '마이크 권한을 허용하고 반려조에게 반복할 말을 또렷하게 녹음해 주세요.',
      startRecording: '녹음 시작',
      stopRecording: '녹음 중지',
      rerecord: '다시 녹음',
      continueCta: '오디오 확인하기',
      confirmAudioTitle: '오디오 확인',
      sessionTemplateLabel: '세션 템플릿',
      saveCta: '세션 설정 저장',
      saveError: '세션 설정을 저장하지 못했어요. 다시 시도해 주세요.',
      savedMessage: '세션 설정을 저장했어요. 홈에서 바로 이어갈 수 있어요.',
      presetPreviewDisabledTitle: '기본 단어 미리듣기 준비 중',
      presetPreviewDisabledBody: '아직 포함된 음원이 없어 가짜 재생 없이 단어와 피치 설정만 저장해요.',
      recordedStatus: '녹음 파일 저장 완료',
      recordingStatus: '녹음 중이에요',
      pitchAppliedStatus: '고정 피치 프로필 적용',
      pitchAppliedBody: '실제 변환 파일은 만들지 않고 재생 시 사용할 1.32x 높은 톤 메타데이터만 저장해요.',
      previewCta: '미리듣기',
      previewDisabledCta: '미리듣기 준비 중',
      selectAudioError: '저장할 오디오를 먼저 선택해 주세요.',
      selectTemplateError: '세션 템플릿을 선택해 주세요.',
      storeLoading: '학습 데이터를 준비하고 있어요. 잠시만 기다려 주세요.',
      zeroDurationError: '세션 시간을 1분 이상으로 설정해 주세요.',
    },
    recording: {
      permissionDenied: '마이크 권한이 거부됐어요. 기기 설정에서 권한을 허용한 뒤 다시 시도해 주세요.',
      startFailed: '녹음을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
      saveFailed: '녹음 파일을 저장하지 못했어요. 다시 녹음해 주세요.',
      tooShort: '녹음이 너무 짧아요. 10초 이상 녹음해 주세요.',
    },
    audioErrors: {
      previewFailed: '미리듣기를 재생하지 못했어요. 다시 시도해 주세요.',
    },
    wordCreate: {
      title: '음성 녹음으로 단어 추가',
      step1Recording: '녹음',
      step2Label: '단어 이름',
      step3Tag: '태그 선택',
      save: '저장',
      cancel: '취소',
      labelPlaceholder: '예: 사랑해',
    },
    wordEdit: {
      title: '단어 편집',
      delete: '삭제',
      confirmDelete: '이 단어를 삭제할까요?',
    },
    wordLibrary: {
      empty: '등록된 단어가 없어요.',
      emptyHint: '위의 + 버튼으로 단어를 추가해 보세요.',
      editAction: '편집',
      deleteAction: '삭제',
      sourcePreset: '기본',
      sourceRecording: '녹음',
    },
    sessionSetupExtra: {
      emptyLibrary: '등록된 단어가 없습니다. 단어 탭에서 추가하세요.',
    },
    profile: {
      kicker: 'PROFILE',
      title: '반려조 프로필',
      body: 'MVP에서는 한 마리 프로필만 조회하고 수정할 수 있어요.',
      editCta: '프로필 수정',
      nameLabel: '이름',
      namePlaceholder: '이름',
      speciesLabel: '종',
      speciesPlaceholder: '종을 입력해 주세요',
      saveError: '프로필 수정 내용을 저장하지 못했어요. 다시 시도해 주세요.',
      futureTitle: '추후 제공 예정',
      futureBody: '프로필 추가 등록, 삭제, 여러 반려조 전환은 현재 범위에 포함되지 않아요.',
      languageTitle: '앱 언어',
      languageBody: '핵심 화면과 기본 템플릿을 선택한 언어로 표시해요.',
      languageSaveError: '언어 설정을 저장하지 못했어요. 다시 시도해 주세요.',
      avatarSelect: '사진 선택',
      avatarError: '사진을 불러오지 못했어요. 사진 없이 계속할 수 있어요.',
      cardGoalCount: '학습 목표 %{count}개가 연결되어 있어요.',
    },
    profileOptions: {
      speciesOptions: {
        'african-grey': '회색앵무',
        budgie: '사랑앵무',
        cockatoo: '코카투',
        conure: '코뉴어',
        lovebird: '모란앵무',
        parakeet: '잉꼬',
      },
      trainingGoals: {
        greet: { label: '인사말', sample: '안녕, 잘 자, 사랑해' },
        fruit: { label: '과일·음식', sample: '사과, 바나나, 물' },
        name: { label: '이름 부르기', sample: '망고야, 엄마, 아빠' },
        leave: { label: '외출 인사', sample: '잘 다녀와, 빠빠이' },
        song: { label: '짧은 노래', sample: '도레미, 휘파람' },
      },
    },
    trainingTemplates: {
      presetWords: [
        { id: 'hello', label: '안녕', phrase: '안녕', description: '가장 먼저 반복하기 좋은 짧은 인사말' },
        { id: 'apple', label: '사과', phrase: '사과', description: '간식 맥락과 연결하기 쉬운 단어' },
        { id: 'water', label: '물', phrase: '물', description: '일상 돌봄 루틴에 붙일 수 있는 단어' },
        { id: 'bye', label: '잘 다녀와', phrase: '잘 다녀와', description: '외출 전후 반복하기 좋은 문장' },
      ],
      sessions: [
        { id: 'starter', label: '첫 적응 20분', description: '짧은 학습과 충분한 휴식으로 반응을 살펴봐요.', totalDurationSeconds: 1200, learningDurationSeconds: 240, restDurationSeconds: 120 },
        { id: 'routine', label: '기본 루틴 1시간', description: '15분 학습과 5분 휴식을 반복하는 기본 세션이에요.', totalDurationSeconds: 3600, learningDurationSeconds: 900, restDurationSeconds: 300 },
        { id: 'deep', label: '집중 루틴 3시간', description: '앱을 켜둔 상태에서 긴 반복 루틴을 실험해요.', totalDurationSeconds: 10800, learningDurationSeconds: 900, restDurationSeconds: 300 },
      ],
    },
  },
  en: {
    common: {
      add: 'Add',
      cancel: 'Cancel',
      customInput: '+ Custom',
      directInput: 'Custom',
      next: 'Next',
      save: 'Save',
      saving: 'Saving...',
      selected: 'Selected',
      start: 'Get started',
      age: {
        months: '%{months} mo',
        years: '%{years} yr',
        yearsMonths: '%{years} yr %{months} mo',
      },
      duration: {
        minutes: '%{minutes} min',
        hours: '%{hours} hr',
        hoursMinutes: '%{hours} hr %{minutes} min',
      },
      languageNames: {
        ko: '한국어',
        en: 'English',
      },
    },
    tabs: {
      home: 'Home',
      profile: 'Profile',
    },
    validation: {
      nameRequired: 'Enter your bird’s name.',
      speciesRequired: 'Choose or enter your bird’s species.',
      ageInvalid: 'Age can be set from 1 month to 10 years.',
      goalRequired: 'Choose at least one training goal.',
    },
    onboarding: {
      welcome: {
        kicker: 'STEP 01',
        title: 'Talk more deeply\nwith your parrot',
        body: 'AI turns your voice into a clear 1–4 kHz high tone that parrots can notice more easily.',
        cta: 'Get started',
      },
      profile: {
        kicker: 'STEP 02',
        title: 'Tell us about\nyour bird',
        body: 'For the MVP, one profile connects the home screen with training history.',
        nameLabel: 'Name',
        namePlaceholder: 'e.g. Mango',
        speciesLabel: 'Species',
        speciesPlaceholder: 'Enter species',
        ageLabel: 'Age',
        minusMonth: '- 1 mo',
        plusMonth: '+ 1 mo',
      },
      goals: {
        kicker: 'STEP 03',
        title: 'Choose the first\nwords to play',
        body: 'Selected goals stay connected so you can continue from home.',
        fallbackError: 'Please check the profile details again.',
        saveError: 'Could not save the profile. Please try again soon.',
        cta: 'Start (%{count})',
      },
    },
    home: {
      kicker: 'TODAY',
      greeting: 'Hello,\ntraining with %{name}',
      body: 'Ready to wake up your bird’s ears with a short repeating sound routine?',
      sessionTitle: 'Start a new session',
      phasePill: 'Session setup',
      sessionBody: 'Choose a preset word or record your own voice to set today’s training audio.',
      disabledCta: 'Session setup coming soon',
      startSessionCta: 'Set up session',
      totalTrainingTime: 'Total training time',
      trainingGoals: 'Training goals',
      goalCount: '%{count}',
      singleProfileTitle: 'Single MVP profile',
      singleProfileBody: 'Only one bird profile is supported for now. Adding and deleting profiles will come later.',
      profileLink: 'View profile',
      presetPreviewTitle: 'Preset words',
      sessionTemplateTitle: 'Session templates',
    },
    audio: {
      waveformPreviewLabel: '1–4 kHz voice waveform preview',
    },
    sessionSetup: {
      kicker: 'SESSION SETUP',
      title: 'Choose the sound\nfor today',
      body: 'Pick a short word or record your own voice, then save high-tone metadata that is easier for parrots to notice.',
      sourceLabel: 'Audio source',
      presetSource: 'Preset word',
      recordingSource: 'Record voice',
      presetLabel: 'Choose preset word',
      recordingLabel: 'Record audio',
      recordingBody: 'Allow microphone access and clearly record the phrase you want your bird to hear.',
      startRecording: 'Start recording',
      stopRecording: 'Stop recording',
      rerecord: 'Record again',
      continueCta: 'Review audio',
      confirmAudioTitle: 'Review audio',
      sessionTemplateLabel: 'Session template',
      saveCta: 'Save session setup',
      saveError: 'Could not save the session setup. Please try again.',
      savedMessage: 'Session setup saved. You can continue from home.',
      presetPreviewDisabledTitle: 'Preset preview is being prepared',
      presetPreviewDisabledBody: 'No bundled audio exists yet, so the app saves the word and pitch settings without fake playback.',
      recordedStatus: 'Recording saved',
      recordingStatus: 'Recording now',
      pitchAppliedStatus: 'Fixed pitch profile applied',
      pitchAppliedBody: 'No transformed DSP file is created yet. The app saves 1.32x high-tone playback metadata only.',
      previewCta: 'Preview',
      previewDisabledCta: 'Preview pending',
      selectAudioError: 'Choose audio before saving.',
      selectTemplateError: 'Choose a session template.',
      storeLoading: 'Preparing training data. Please wait a moment.',
      zeroDurationError: 'Set the session duration to at least 1 minute.',
    },
    recording: {
      permissionDenied: 'Microphone permission was denied. Allow access in device settings and try again.',
      startFailed: 'Could not start recording. Please try again soon.',
      saveFailed: 'Could not save the recording. Please record again.',
      tooShort: 'Recording is too short. Please record for at least 10 seconds.',
    },
    audioErrors: {
      previewFailed: 'Could not play the preview. Please try again.',
    },
    wordCreate: {
      title: 'Add word by voice recording',
      step1Recording: 'Record',
      step2Label: 'Word name',
      step3Tag: 'Choose tag',
      save: 'Save',
      cancel: 'Cancel',
      labelPlaceholder: 'e.g. I love you',
    },
    wordEdit: {
      title: 'Edit word',
      delete: 'Delete',
      confirmDelete: 'Delete this word?',
    },
    wordLibrary: {
      empty: 'No words yet.',
      emptyHint: 'Tap the + button above to add a word.',
      editAction: 'Edit',
      deleteAction: 'Delete',
      sourcePreset: 'Built-in',
      sourceRecording: 'Recorded',
    },
    sessionSetupExtra: {
      emptyLibrary: 'No words in library. Add one from the Words tab.',
    },
    profile: {
      kicker: 'PROFILE',
      title: 'Bird profile',
      body: 'For the MVP, you can view and edit one bird profile.',
      editCta: 'Edit profile',
      nameLabel: 'Name',
      namePlaceholder: 'Name',
      speciesLabel: 'Species',
      speciesPlaceholder: 'Enter species',
      saveError: 'Could not save profile changes. Please try again.',
      futureTitle: 'Coming later',
      futureBody: 'Adding profiles, deleting profiles, and switching between multiple birds are outside the current scope.',
      languageTitle: 'App language',
      languageBody: 'Core screens and starter templates will use the selected language.',
      languageSaveError: 'Could not save the language setting. Please try again.',
      avatarSelect: 'Choose photo',
      avatarError: 'Could not load the photo. You can continue without one.',
      cardGoalCount: '%{count} training goals are connected.',
    },
    profileOptions: {
      speciesOptions: {
        'african-grey': 'African Grey',
        budgie: 'Budgie',
        cockatoo: 'Cockatoo',
        conure: 'Conure',
        lovebird: 'Lovebird',
        parakeet: 'Parakeet',
      },
      trainingGoals: {
        greet: { label: 'Greetings', sample: 'Hello, good night, love you' },
        fruit: { label: 'Food words', sample: 'Apple, banana, water' },
        name: { label: 'Name calling', sample: 'Mango, mom, dad' },
        leave: { label: 'Leaving cues', sample: 'See you, bye-bye' },
        song: { label: 'Short songs', sample: 'Do re mi, whistle' },
      },
    },
    trainingTemplates: {
      presetWords: [
        { id: 'hello', label: 'Hello', phrase: 'Hello', description: 'A short greeting that works well as a first repetition.' },
        { id: 'apple', label: 'Apple', phrase: 'Apple', description: 'Easy to connect with treat time.' },
        { id: 'water', label: 'Water', phrase: 'Water', description: 'A practical word for daily care routines.' },
        { id: 'bye', label: 'See you', phrase: 'See you', description: 'Good for repeating before and after leaving home.' },
      ],
      sessions: [
        { id: 'starter', label: '20 min starter', description: 'Short learning blocks with enough rest to observe reactions.', totalDurationSeconds: 1200, learningDurationSeconds: 240, restDurationSeconds: 120 },
        { id: 'routine', label: '1 hr routine', description: 'The default session repeats 15 minutes of learning and 5 minutes of rest.', totalDurationSeconds: 3600, learningDurationSeconds: 900, restDurationSeconds: 300 },
        { id: 'deep', label: '3 hr focus', description: 'Try a longer foreground routine while the app stays open.', totalDurationSeconds: 10800, learningDurationSeconds: 900, restDurationSeconds: 300 },
      ],
    },
  },
};

export const DEFAULT_LOCALE: AppLocale = 'ko';

export function isSupportedLocale(locale: string): locale is AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale);
}

export function normalizeLocale(languageTag?: string | null): AppLocale {
  const languageCode = languageTag?.split('-')[0]?.toLowerCase();
  return languageCode && isSupportedLocale(languageCode) ? languageCode : DEFAULT_LOCALE;
}
