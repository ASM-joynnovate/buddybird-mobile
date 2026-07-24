export const SUPPORTED_LOCALES = ['ko', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

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
      unknown: string;
    };
    birthDate: {
      label: string;
      yearUnit: string;
      monthUnit: string;
      dayUnit: string;
      unknown: string;
      unknownHint: string;
      yearPickerA11y: string;
      monthPickerA11y: string;
      dayPickerA11y: string;
    };
    duration: {
      seconds: string;
      minutes: string;
      hours: string;
      hoursMinutes: string;
    };
    closeA11y: string;
    mascotA11y: string;
    languageNames: Record<AppLocale, string>;
  };
  tabs: {
    home: string;
    words: string;
    profile: string;
  };
  validation: {
    nameRequired: string;
    speciesRequired: string;
    birthDateFuture: string;
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
    startTrainingCta: string;
    totalTrainingTime: string;
    singleProfileTitle: string;
    singleProfileBody: string;
    profileLink: string;
    presetPreviewTitle: string;
    sessionTemplateTitle: string;
    trainingLoadError: string;
    wordsSectionTitle: string;
    durationSectionTitle: string;
    startDisabledA11y: string;
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
    presets: {
      short: { label: string; description: string };
      medium: { label: string; description: string };
      long: { label: string; description: string };
    };
    customPresetLabel: string;
    customPresetDescription: string;
    totalDurationLabel: string;
    hourPickerA11y: string;
    minutePickerA11y: string;
    hourUnit: string;
    minuteUnit: string;
    learnLabel: string;
    restLabel: string;
    wordSelectA11y: string;
  };
  sessionActive: {
    stopLabel: string;
    stopA11y: string;
    cycleBadge: string;
    restingTitle: string;
    restingBody: string;
    playingBadge: string;
    waitingBadge: string;
    pausedBadge: string;
    preparing: string;
    startFailed: string;
    pause: string;
    resume: string;
    exitConfirmTitle: string;
    exitConfirmBody: string;
    exitConfirmStop: string;
    exitConfirmContinue: string;
  };
  sessionComplete: {
    title: string;
    subtitle: string;
    streakLabel: string;
    totalTimeLabel: string;
    continueCta: string;
  };
  sessionRecovery: {
    interruptedTitle: string;
    interruptedBody: string;
    interruptedAction: string;
    interruptedActionA11y: string;
  };
  recording: {
    permissionDenied: string;
    startFailed: string;
    saveFailed: string;
    blockedBySession: string;
    tooShort: string;
    playLabel: string;
    stopPlayLabel: string;
    startA11y: string;
    stopA11y: string;
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
    backA11y: string;
    saveErrorTitle: string;
    saveErrorBody: string;
  };
  wordEdit: {
    title: string;
    delete: string;
    confirmDelete: string;
    deleteErrorTitle: string;
    deleteErrorBody: string;
  };
  wordLibrary: {
    empty: string;
    emptyHint: string;
    editAction: string;
    deleteAction: string;
    sourcePreset: string;
    sourceRecording: string;
    screenTitle: string;
    addWordA11y: string;
    editA11y: string;
    previewA11y: string;
    loadError: string;
    filterAll: string;
    tagLabels: {
      greeting: string;
      food: string;
      name: string;
      etc: string;
    };
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
    languageSaveError: string;
    avatarSelect: string;
    avatarError: string;
    editTitle: string;
    editBackA11y: string;
    achievementsTitle: string;
    streakAchievementLabel: string;
    streakAchievementSub: string;
    todayAchievementSub: string;
    totalAchievementSub: string;
    masterAchievementLabel: string;
    masterAchievementSub: string;
    statStreakLabel: string;
    statTodayLabel: string;
    statTotalLabel: string;
  };
  profileOptions: {
    speciesOptions: Record<string, string>;
    sizeLabels: Record<'small' | 'medium' | 'large', string>;
  };
  feedback: {
    promptTitle: string;
    promptMessage: string;
    promptWrite: string;
    promptDismiss: string;
    formTitle: string;
    formPlaceholder: string;
    formPrivacyNotice: string;
    formSubmit: string;
    formRetry: string;
    formError: string;
    thanksTitle: string;
    thanksMessage: string;
    thanksClose: string;
    profileCta: string;
  };
  appUpdate: {
    title: string;
    versionPrefix: string;
    updateButton: string;
    cancelButton: string;
  };
}

export const translations: Record<AppLocale, AppCopy> = {
  ko: {
    common: {
      add: '추가',
      cancel: '취소',
      customInput: '직접 입력',
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
        unknown: '나이 모름',
      },
      birthDate: {
        label: '생년월일',
        yearUnit: '년',
        monthUnit: '월',
        dayUnit: '일',
        unknown: '모름',
        unknownHint: '생년월일을 몰라도 괜찮아요.',
        yearPickerA11y: '태어난 연도 선택',
        monthPickerA11y: '태어난 월 선택',
        dayPickerA11y: '태어난 일 선택',
      },
      duration: {
        seconds: '%{seconds}초',
        minutes: '%{minutes}분',
        hours: '%{hours}시간',
        hoursMinutes: '%{hours}시간 %{minutes}분',
      },
      closeA11y: '닫기',
      mascotA11y: '버디 마스코트',
      languageNames: {
        ko: '한국어',
        en: 'English',
      },
    },
    tabs: {
      home: '학습',
      words: '단어',
      profile: '프로필',
    },
    validation: {
      nameRequired: '반려조 이름을 입력해 주세요.',
      speciesRequired: '반려조 종류를 선택하거나 직접 입력해 주세요.',
      birthDateFuture: '생년월일은 오늘 이후로 설정할 수 없어요.',
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
        intro: '우리 앵무새를 소개해 주세요!',
        body: '',
        nameLabel: '이름',
        namePlaceholder: '예: 망고',
        speciesLabel: '종',
        speciesPlaceholder: '종을 입력해 주세요',
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
      startTrainingCta: '학습 시작',
      totalTrainingTime: '누적 학습 시간',
      singleProfileTitle: 'MVP 단일 프로필',
      singleProfileBody: '현재는 한 마리 프로필만 지원해요. 추가 등록과 삭제는 추후 제공 예정입니다.',
      profileLink: '프로필 확인하기',
      presetPreviewTitle: '기본 단어',
      sessionTemplateTitle: '추천 학습',
      trainingLoadError: '학습 데이터를 불러오지 못했어요.',
      wordsSectionTitle: '단어',
      durationSectionTitle: '학습 시간',
      startDisabledA11y: '학습할 단어와 시간을 설정하면 시작할 수 있어요',
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
      presets: {
        short: { label: '짧게', description: '샤워하거나 잠시 자리를 비울 때' },
        medium: { label: '중간', description: '짧은 외출로 자리를 비울 때' },
        long: { label: '길게', description: '여행 등으로 인해 길게 자리를 비울 때' },
      },
      customPresetLabel: '직접 설정',
      customPresetDescription: '원하는 시간을 직접 정해요',
      totalDurationLabel: '총 학습 시간',
      hourPickerA11y: '시간 선택',
      minutePickerA11y: '분 선택',
      hourUnit: '시간',
      minuteUnit: '분',
      learnLabel: '학습',
      restLabel: '휴식',
      wordSelectA11y: '%{label} 선택',
    },
    sessionActive: {
      stopLabel: '종료',
      stopA11y: '세션 종료',
      cycleBadge: '사이클 %{cycle}/%{total}',
      restingTitle: '잠시 쉬어요',
      restingBody: '잠시 쉬는 동안에도\n새로 말한 소리는 기록해요.',
      playingBadge: '"%{word}" 재생 중',
      waitingBadge: '다음 반복 대기',
      pausedBadge: '일시정지 중',
      preparing: '준비 중',
      startFailed: '시작 실패',
      pause: '일시정지',
      resume: '계속하기',
      exitConfirmTitle: '학습 세션을 종료할까요?',
      exitConfirmBody: '종료하면 진행 중인 학습이 끝나요. 계속 진행하면 학습 화면으로 돌아가요.',
      exitConfirmStop: '종료',
      exitConfirmContinue: '계속 진행',
    },
    sessionComplete: {
      title: '학습 완료! 🎉',
      subtitle: '%{petName} "%{word}"를 %{duration} 동안 들었어요',
      streakLabel: '연속',
      totalTimeLabel: '총 학습 시간',
      continueCta: '계속',
    },
    sessionRecovery: {
      interruptedTitle: '이전 학습이 중단됐어요',
      interruptedBody: '‘%{word}’ 학습 %{duration}이 기록에 저장됐어요.',
      interruptedAction: '닫기',
      interruptedActionA11y: '중단 안내 닫기',
    },
    recording: {
      permissionDenied: '마이크 권한이 거부됐어요. 기기 설정에서 권한을 허용한 뒤 다시 시도해 주세요.',
      startFailed: '녹음을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
      saveFailed: '녹음 파일을 저장하지 못했어요. 다시 녹음해 주세요.',
      blockedBySession: '현재는 녹음할 수 없습니다.',
      tooShort: '녹음이 너무 짧아요. 10초 이상 녹음해 주세요.',
      playLabel: '녹음 재생',
      stopPlayLabel: '중단',
      startA11y: '음성 녹음',
      stopA11y: '음성 녹음 중지',
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
      backA11y: '뒤로 가기',
      saveErrorTitle: '저장 실패',
      saveErrorBody: '단어를 저장하지 못했어요. 다시 시도해 주세요.',
    },
    wordEdit: {
      title: '단어 수정',
      delete: '삭제',
      confirmDelete: '"%{label}" 단어를 삭제할까요?',
      deleteErrorTitle: '삭제 실패',
      deleteErrorBody: '단어를 삭제하지 못했어요. 다시 시도해 주세요.',
    },
    wordLibrary: {
      empty: '단어가 없어요.',
      emptyHint: '+ 버튼으로 녹음해 추가해 보세요!',
      editAction: '편집',
      deleteAction: '삭제',
      sourcePreset: '프리셋',
      sourceRecording: '내 녹음',
      screenTitle: '단어 관리',
      addWordA11y: '단어 추가',
      editA11y: '%{label} 수정',
      previewA11y: '%{label} 미리듣기',
      loadError: '단어 목록을 불러오지 못했어요.',
      filterAll: '전체',
      tagLabels: {
        greeting: '인사',
        food: '음식',
        name: '이름',
        etc: '기타',
      },
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
      languageSaveError: '언어 설정을 저장하지 못했어요. 다시 시도해 주세요.',
      avatarSelect: '프로필 사진 선택',
      avatarError: '사진을 불러오지 못했어요. 사진 없이 계속할 수 있어요.',
      editTitle: '프로필 편집',
      editBackA11y: '프로필 화면으로 돌아가기',
      achievementsTitle: '업적',
      streakAchievementLabel: '%{days}일 연속',
      streakAchievementSub: '불꽃 지킴이',
      todayAchievementSub: '오늘의 학습',
      totalAchievementSub: '누적 학습시간',
      masterAchievementLabel: '리포트',
      masterAchievementSub: '제공 예정',
      statStreakLabel: '연속일',
      statTodayLabel: '오늘 학습시간',
      statTotalLabel: '총 학습시간',
    },
    profileOptions: {
      speciesOptions: {
        'african-grey': '회색앵무',
        amazon: '아마존앵무',
        budgie: '사랑앵무(잉꼬)',
        caique: '카이큐',
        cockatiel: '왕관앵무',
        cockatoo: '코카투',
        conure: '코뉴어',
        eclectus: '뉴기니아앵무',
        lory: '로리앵무',
        lovebird: '모란앵무',
        macaw: '금강앵무',
        parrotlet: '유리앵무',
        quaker: '퀘이커',
        ringneck: '목도리앵무',
        senegal: '세네갈앵무',
      },
      sizeLabels: {
        small: '소형',
        medium: '중형',
        large: '대형',
      },
    },
    feedback: {
      promptTitle: '의견을 들려주세요',
      promptMessage: '버디버드를 쓰면서 느낀 점이나 바라는 점을 자유롭게 남겨 주세요. 큰 힘이 됩니다!',
      promptWrite: '피드백 남기기',
      promptDismiss: '닫기',
      formTitle: '피드백 보내기',
      formPlaceholder: '개선하면 좋을 점, 불편한 점, 바라는 기능을 자유롭게 적어 주세요.',
      formPrivacyNotice: '⚠ 이름·연락처 등 개인정보는 입력하지 마세요.',
      formSubmit: '보내기',
      formRetry: '다시 보내기',
      formError: '보내지 못했어요. 잠시 후 다시 시도해 주세요.',
      thanksTitle: '감사합니다!',
      thanksMessage: '소중한 의견이 잘 전달됐어요. 더 나은 버디버드를 만드는 데 반영할게요.',
      thanksClose: '확인',
      profileCta: '피드백 보내기',
    },
    appUpdate: {
      title: '업데이트 알림',
      versionPrefix: 'v',
      updateButton: '업데이트',
      cancelButton: '닫기',
    },
  },
  en: {
    common: {
      add: 'Add',
      cancel: 'Cancel',
      customInput: 'Custom',
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
        unknown: 'Age unknown',
      },
      birthDate: {
        label: 'Birth date',
        yearUnit: 'Y',
        monthUnit: 'M',
        dayUnit: 'D',
        unknown: "Don't know",
        unknownHint: "It's okay if you don't know the birth date.",
        yearPickerA11y: 'Select birth year',
        monthPickerA11y: 'Select birth month',
        dayPickerA11y: 'Select birth day',
      },
      duration: {
        seconds: '%{seconds}s',
        minutes: '%{minutes}m',
        hours: '%{hours}h',
        hoursMinutes: '%{hours}h %{minutes}m',
      },
      closeA11y: 'Close',
      mascotA11y: 'Buddy mascot',
      languageNames: {
        ko: '한국어',
        en: 'English',
      },
    },
    tabs: {
      home: 'Learn',
      words: 'Words',
      profile: 'Profile',
    },
    validation: {
      nameRequired: "Enter your bird’s name.",
      speciesRequired: "Enter your bird’s species.",
      birthDateFuture: "Birth date can’t be in the future.",
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
        intro: 'Introduce your parrot!',
        body: 'For the MVP, one profile connects the home screen with training history.',
        nameLabel: 'Name',
        namePlaceholder: 'e.g. Mango',
        speciesLabel: 'Species',
        speciesPlaceholder: 'Enter species',
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
      startTrainingCta: 'Start training',
      totalTrainingTime: 'Total training time',
      singleProfileTitle: 'Single MVP profile',
      singleProfileBody: 'Only one bird profile is supported for now. Adding and deleting profiles will come later.',
      profileLink: 'View profile',
      presetPreviewTitle: 'Preset words',
      sessionTemplateTitle: 'Session templates',
      trainingLoadError: 'Could not load training data.',
      wordsSectionTitle: 'Words',
      durationSectionTitle: 'Session time',
      startDisabledA11y: 'Choose a word and duration to start',
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
      presets: {
        short: { label: 'Short', description: 'For a shower or a quick break' },
        medium: { label: 'Medium', description: 'For a short outing' },
        long: { label: 'Long', description: 'For longer time away, like a trip' },
      },
      customPresetLabel: 'Custom',
      customPresetDescription: 'Set your own duration',
      totalDurationLabel: 'Total session time',
      hourPickerA11y: 'Select hours',
      minutePickerA11y: 'Select minutes',
      hourUnit: 'h',
      minuteUnit: 'm',
      learnLabel: 'Learning',
      restLabel: 'Rest',
      wordSelectA11y: 'Select %{label}',
    },
    sessionActive: {
      stopLabel: 'End',
      stopA11y: 'End session',
      cycleBadge: 'Cycle %{cycle}/%{total}',
      restingTitle: 'Taking a break',
      restingBody: 'Even during the break,\nnew sounds are still recorded.',
      playingBadge: 'Playing "%{word}"',
      waitingBadge: 'Waiting for next repeat',
      pausedBadge: 'Paused',
      preparing: 'Preparing',
      startFailed: 'Failed to start',
      pause: 'Pause',
      resume: 'Resume',
      exitConfirmTitle: 'End the training session?',
      exitConfirmBody: 'Ending now stops the training in progress. Keep going to return to the session.',
      exitConfirmStop: 'End',
      exitConfirmContinue: 'Keep going',
    },
    sessionComplete: {
      title: 'Session complete! 🎉',
      subtitle: '%{petName} listened to "%{word}" for %{duration}',
      streakLabel: 'Streak',
      totalTimeLabel: 'Total time',
      continueCta: 'Continue',
    },
    sessionRecovery: {
      interruptedTitle: 'Your last session was interrupted',
      interruptedBody: '%{duration} of "%{word}" training was saved.',
      interruptedAction: 'Close',
      interruptedActionA11y: 'Dismiss interruption notice',
    },
    recording: {
      permissionDenied: 'Microphone permission was denied. Allow access in device settings and try again.',
      startFailed: 'Could not start recording. Please try again soon.',
      saveFailed: 'Could not save the recording. Please record again.',
      blockedBySession: 'Recording is not available right now.',
      tooShort: 'Recording is too short. Please record for at least 10 seconds.',
      playLabel: 'Play recording',
      stopPlayLabel: 'Stop',
      startA11y: 'Record audio',
      stopA11y: 'Stop recording',
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
      backA11y: 'Go back',
      saveErrorTitle: 'Save failed',
      saveErrorBody: 'Could not save the word. Please try again.',
    },
    wordEdit: {
      title: 'Edit word',
      delete: 'Delete',
      confirmDelete: 'Delete "%{label}"?',
      deleteErrorTitle: 'Delete failed',
      deleteErrorBody: 'Could not delete the word. Please try again.',
    },
    wordLibrary: {
      empty: 'No words yet.',
      emptyHint: 'Tap + to record and add a word!',
      editAction: 'Edit',
      deleteAction: 'Delete',
      sourcePreset: 'Preset',
      sourceRecording: 'My recording',
      screenTitle: 'Word library',
      addWordA11y: 'Add word',
      editA11y: 'Edit %{label}',
      previewA11y: 'Preview %{label}',
      loadError: 'Could not load your words.',
      filterAll: 'All',
      tagLabels: {
        greeting: 'Greeting',
        food: 'Food',
        name: 'Name',
        etc: 'Other',
      },
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
      languageSaveError: 'Could not save the language setting. Please try again.',
      avatarSelect: 'Select profile photo',
      avatarError: 'Could not load the photo. You can continue without one.',
      editTitle: 'Edit profile',
      editBackA11y: 'Back to profile',
      achievementsTitle: 'Achievements',
      streakAchievementLabel: '%{days} day streak',
      streakAchievementSub: 'Flame keeper',
      todayAchievementSub: 'Today’s learning',
      totalAchievementSub: 'Total learning time',
      masterAchievementLabel: 'Report',
      masterAchievementSub: 'Coming soon',
      statStreakLabel: 'Streak days',
      statTodayLabel: 'Today’s time',
      statTotalLabel: 'Total time',
    },
    profileOptions: {
      speciesOptions: {
        'african-grey': 'African Grey',
        amazon: 'Amazon',
        budgie: 'Budgie',
        caique: 'Caique',
        cockatiel: 'Cockatiel',
        cockatoo: 'Cockatoo',
        conure: 'Conure',
        eclectus: 'Eclectus',
        lory: 'Lory',
        lovebird: 'Lovebird',
        macaw: 'Macaw',
        parrotlet: 'Parrotlet',
        quaker: 'Quaker',
        ringneck: 'Indian Ringneck',
        senegal: 'Senegal',
      },
      sizeLabels: {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
      },
    },
    feedback: {
      promptTitle: 'Tell us what you think',
      promptMessage: 'Share anything you love or wish were different about BuddyBird. It really helps!',
      promptWrite: 'Give feedback',
      promptDismiss: 'Close',
      formTitle: 'Send feedback',
      formPlaceholder: 'Tell us what to improve, what feels off, or a feature you wish existed.',
      formPrivacyNotice: '⚠ Please do not include personal info like your name or contact details.',
      formSubmit: 'Send',
      formRetry: 'Try again',
      formError: 'Could not send. Please try again in a moment.',
      thanksTitle: 'Thank you!',
      thanksMessage: 'Your feedback came through. We will use it to make BuddyBird better.',
      thanksClose: 'Done',
      profileCta: 'Send feedback',
    },
    appUpdate: {
      title: 'Update available',
      versionPrefix: 'v',
      updateButton: 'Update',
      cancelButton: 'Close',
    },
  },
};

// 미지원 언어 기기의 fallback — UI·프리셋 단어가 함께 이 로케일을 따른다 (ko 기기는 여전히 ko).
export const DEFAULT_LOCALE: AppLocale = 'en';

export function isSupportedLocale(locale: string): locale is AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale);
}

export function normalizeLocale(languageTag?: string | null): AppLocale {
  const languageCode = languageTag?.split('-')[0]?.toLowerCase();
  return languageCode && isSupportedLocale(languageCode) ? languageCode : DEFAULT_LOCALE;
}
