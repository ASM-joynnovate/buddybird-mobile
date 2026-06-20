export const SUPPORTED_LOCALES = ['ko', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

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
  };
  onboarding: {
    welcome: {
      bubble: string;
      title: string;
      bodyBefore: string;
      bodyEmphasis: string;
      bodyAfter: string;
    };
    profile: {
      title: string;
      intro: string;
      body: string;
      nameLabel: string;
      namePlaceholder: string;
      speciesLabel: string;
      speciesPlaceholder: string;
      ageLabel: string;
      minusMonth: string;
      plusMonth: string;
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
    body: string;
    kicker: string;
    wordLabel: string;
    categoryLabel: string;
    recorderKicker: string;
    emptyWord: string;
    readyStatus: string;
    recordingStatus: string;
    recordedStatus: string;
    permissionStatus: string;
    playbackTitle: string;
    playbackSource: string;
    addToTraining: string;
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
  };
  profileOptions: {
    speciesOptions: Record<string, string>;
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
    },
    onboarding: {
      welcome: {
        bubble: '안녕하세요! 저는 버디예요.\n함께 앵무새에게 말을 가르쳐 봐요!',
        title: '앵무새와 더 깊이 대화하기',
        bodyBefore: '반려인의 목소리를 녹음해서\n앵무새에게 ',
        bodyEmphasis: '매일 반복해',
        bodyAfter: ' 들려주세요.',
      },
      profile: {
        title: '반려조 프로필을\n알려주세요',
        intro: '새 친구를 소개해 주세요!',
        body: '',
        nameLabel: '이름',
        namePlaceholder: '예: 망고',
        speciesLabel: '종',
        speciesPlaceholder: '종을 입력해 주세요',
        ageLabel: '나이 · %{years}년 %{months}개월',
        minusMonth: '- 1개월',
        plusMonth: '+ 1개월',
      },
    },
    home: {
      kicker: 'TODAY',
      greeting: '안녕하세요,\n%{name}와 함께',
      body: '오늘도 짧고 반복적인 소리 루틴으로 반려조의 귀를 깨워볼까요?',
      sessionTitle: '새 학습 시작',
      phasePill: '학습 설정',
      sessionBody: '기본 단어를 고르거나 직접 녹음해 오늘 들려줄 학습 오디오를 정해요.',
      disabledCta: '학습 설정 준비 중',
      startSessionCta: '학습 설정하기',
      totalTrainingTime: '누적 학습 시간',
      singleProfileTitle: 'MVP 단일 프로필',
      singleProfileBody: '현재는 한 마리 프로필만 지원해요. 추가 등록과 삭제는 추후 제공 예정입니다.',
      profileLink: '프로필 확인하기',
      presetPreviewTitle: '기본 단어',
      sessionTemplateTitle: '추천 학습',
    },
    audio: {
      waveformPreviewLabel: '1–4 kHz 음성 파형 미리보기',
    },
    sessionSetup: {
      kicker: 'SESSION SETUP',
      title: '학습',
      body: '자리를 비우는 시간 동안 단어를 반복해서 들려줘요.',
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
      sessionTemplateLabel: '학습 템플릿',
      saveCta: '학습 설정 저장',
      saveError: '학습 설정을 저장하지 못했어요. 다시 시도해 주세요.',
      savedMessage: '학습 설정을 저장했어요. 홈에서 바로 이어갈 수 있어요.',
      presetPreviewDisabledTitle: '기본 단어 미리듣기 준비 중',
      presetPreviewDisabledBody: '아직 포함된 음원이 없어 가짜 재생 없이 단어와 피치 설정만 저장해요.',
      recordedStatus: '녹음 파일 저장 완료',
      recordingStatus: '녹음 중이에요',
      pitchAppliedStatus: '고정 피치 프로필 적용',
      pitchAppliedBody: '실제 변환 파일은 만들지 않고 재생 시 사용할 1.32x 높은 톤 메타데이터만 저장해요.',
      previewCta: '미리듣기',
      previewDisabledCta: '미리듣기 준비 중',
      selectAudioError: '저장할 오디오를 먼저 선택해 주세요.',
      selectTemplateError: '학습 템플릿을 선택해 주세요.',
      storeLoading: '학습 데이터를 준비하고 있어요. 잠시만 기다려 주세요.',
      zeroDurationError: '학습 시간을 1분 이상으로 설정해 주세요.',
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
      title: '단어 녹음',
      body: '가르칠 단어를 녹음하면 학습에 사용할 수 있어요.',
      kicker: '단어 추가',
      wordLabel: '단어',
      categoryLabel: '카테고리',
      recorderKicker: '녹음할 단어',
      emptyWord: '새 단어',
      readyStatus: '버튼을 눌러 녹음을 시작하세요',
      recordingStatus: '녹음 중 · %{time} · 탭하면 중지',
      recordedStatus: '녹음 완료! 다시 누르면 재녹음',
      permissionStatus: '마이크 권한을 확인하고 있어요',
      playbackTitle: '녹음 듣기',
      playbackSource: '원본',
      addToTraining: '학습에 추가',
      save: '저장',
      cancel: '취소',
      labelPlaceholder: '예: 사과',
    },
    wordEdit: {
      title: '단어 수정',
      delete: '삭제',
      confirmDelete: '이 단어를 삭제할까요?',
    },
    wordLibrary: {
      empty: '단어가 없어요.',
      emptyHint: '+ 버튼으로 녹음해 추가해 보세요!',
      editAction: '편집',
      deleteAction: '삭제',
      sourcePreset: '프리셋',
      sourceRecording: '내 녹음',
    },
    sessionSetupExtra: {
      emptyLibrary: '등록된 단어가 없습니다. 단어 탭에서 추가하세요.',
    },
    profile: {
      kicker: 'PROFILE',
      title: '반려조 프로필',
      body: '',
      editCta: '프로필 편집',
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
      nameRequired: "Enter your bird’s name.",
      speciesRequired: "Enter your bird’s species.",
    },
    onboarding: {
      welcome: {
        bubble: "Hi! I'm Buddy.\nLet's teach your bird words together!",
        title: 'Talk deeper with your bird',
        bodyBefore: 'Record your own voice\nand play it back ',
        bodyEmphasis: 'every day',
        bodyAfter: ' for your bird.',
      },
      profile: {
        title: 'Tell us about\nyour bird',
        intro: 'Introduce your new friend!',
        body: 'For the MVP, one profile connects the home screen with training history.',
        nameLabel: 'Name',
        namePlaceholder: 'e.g. Mango',
        speciesLabel: 'Species',
        speciesPlaceholder: 'Enter species',
        ageLabel: 'Age · %{years} yr %{months} mo',
        minusMonth: '- 1 mo',
        plusMonth: '+ 1 mo',
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
      title: 'Training',
      body: 'Repeat words while you are away.',
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
      title: 'Record word',
      body: 'Record a word and use it in training.',
      kicker: 'Add word',
      wordLabel: 'Word',
      categoryLabel: 'Category',
      recorderKicker: 'Word to record',
      emptyWord: 'New word',
      readyStatus: 'Tap the button to start recording',
      recordingStatus: 'Recording · %{time} · Tap to stop',
      recordedStatus: 'Recording complete. Tap again to rerecord',
      permissionStatus: 'Checking microphone permission',
      playbackTitle: 'Listen to recording',
      playbackSource: 'Original',
      addToTraining: 'Add to training',
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
      emptyHint: 'Tap + to record and add a word!',
      editAction: 'Edit',
      deleteAction: 'Delete',
      sourcePreset: 'Preset',
      sourceRecording: 'My recording',
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
