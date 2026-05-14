import Slider from '@react-native-community/slider';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Svg } from 'react-native-svg';

import { WaveformPlaceholder } from '@/components/audio/waveform-placeholder';
import { PetScreen } from '@/components/layout/pet-screen';
import { Card } from '@/components/ui/card';
import { FreqBandViz } from '@/components/ui/freq-band-viz';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PillButton } from '@/components/ui/pill-button';
import { WaveformBars } from '@/components/ui/waveform-bars';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAudioPlayer } from 'expo-audio';
import { useAudioRecording } from '@/features/audio/use-audio-recording';
import type { AudioSourceChoice } from '@/features/audio/audio-types';
import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useI18n } from '@/features/i18n/i18n-context';
import { useTrainingData } from '@/features/training/training-context';
import { createTrainingSession, createTrainingWord, selectTrainingWordSummaries } from '@/features/training/training-model';
import type { AudioPitchTransform, CreateTrainingSessionInput, TrainingAudioSourceType, TrainingSessionSettings } from '@/features/training/training-types';

type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

const STEP_SESSION_MINS = 5;
const STEP_LEARN_SECS = 10;
const STEP_REST_SECS = 5;

const PRESET_WORDS = [
  { key: 'hello', word: '안녕',    cat: '인사' },
  { key: 'apple', word: '사과',    cat: '음식' },
  { key: 'water', word: '물',      cat: '음식' },
  { key: 'bye',   word: '잘 다녀와', cat: '인사' },
] as const;

type PresetWord = (typeof PRESET_WORDS)[number];

const PERSONAS = [
  { id: 'child',  label: '아이 톤',    range: '2.5–3.5 kHz' },
  { id: 'female', label: '여성 톤',    range: '1.5–2.5 kHz' },
  { id: 'bird',   label: '새 모방 톤', range: '3.5–4.0 kHz' },
] as const;

type PersonaId = (typeof PERSONAS)[number]['id'];

export default function SessionSetupScreen() {
  const { locale, t } = useI18n();
  const { store, errorMessage: trainingErrorMessage, isHydrated, saveCompletedSession, saveLastSessionSettings, upsertWord } = useTrainingData();

  // setup state
  const [audioSource, setAudioSource] = useState<AudioSourceChoice>('preset');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('hello');
  const [sessionMins, setSessionMins] = useState(20);
  const [learnSecs, setLearnSecs] = useState(60);
  const [restSecs, setRestSecs] = useState(30);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [target, setTarget] = useState(2.8);
  const [persona, setPersona] = useState<PersonaId>('child');

  const {
    errorMessage: recordingErrorMessage,
    lifecycle: recordingLifecycle,
    metering,
    recordingFile,
    requestAndStartRecording,
    resetRecording,
    stopRecording,
  } = useAudioRecording({
    permissionDeniedMessage: t('recording.permissionDenied'),
    saveFailedMessage: t('recording.saveFailed'),
    startFailedMessage: t('recording.startFailed'),
    maxDurationMs: 60_000,
  });

  // running session state
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [phase, setPhase] = useState<'learning' | 'rest'>('learning');
  const [cycle, setCycle] = useState(1);
  const [phaseElapsed, setPhaseElapsed] = useState(0);

  type SessionMeta = {
    wordId: string;
    startedAt: string;
    sourceType: TrainingAudioSourceType;
    totalDurationSeconds: number;
    learningDurationSeconds: number;
    restDurationSeconds: number;
  };
  const sessionMetaRef = useRef<SessionMeta | null>(null);

  // preset:// URI는 가짜이므로 recording 소스만 재생
  const sessionAudioUri = audioSource === 'recording' ? (recordingFile?.uri ?? undefined) : undefined;
  const sessionPlayer = useAudioPlayer(sessionAudioUri);

  const secsPerCycle = learnSecs + restSecs;
  const totalCycles = Math.max(1, Math.floor((sessionMins * 60) / secsPerCycle));
  const selectedPreset = PRESET_WORDS.find((p) => p.key === selectedPresetKey) ?? PRESET_WORDS[0];
  const currentWord = selectedPreset.word;
  const isLearning = phase === 'learning';
  const phaseDuration = isLearning ? learnSecs : restSecs;
  const phaseRemaining = Math.max(0, phaseDuration - phaseElapsed);
  const phaseProgress = Math.min(1, phaseElapsed / Math.max(1, phaseDuration));
  const circum = 2 * Math.PI * 96;

  const wordSummaries = useMemo(
    () => (store ? selectTrainingWordSummaries(store) : []),
    [store]
  );
  function getPresetSessions(presetKey: string): number {
    return wordSummaries
      .filter((s) => s.word.presetKey === presetKey)
      .reduce((sum, s) => sum + s.progress.sessionCount, 0);
  }

  const canContinue =
    isHydrated &&
    (audioSource === 'preset' ||
     (audioSource === 'recording' && recordingLifecycle === 'recorded' && recordingFile !== null));

  // 1-second tick
  useEffect(() => {
    if (status !== 'running') return;
    const iv = setInterval(() => {
      setPhaseElapsed((prev) => {
        const next = prev + 1;
        if (next < phaseDuration) return next;
        if (phase === 'learning') {
          setPhase('rest');
          return 0;
        }
        if (cycle >= totalCycles) {
          setStatus('completed');
          setCycle(1);
          setPhase('learning');
          return 0;
        }
        setCycle((c) => c + 1);
        setPhase('learning');
        return 0;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [status, phase, cycle, totalCycles, phaseDuration]);

  // 오디오: 학습 페이즈에서 재생, 나머지에서 정지
  useEffect(() => {
    if (!sessionAudioUri) return;
    if (status === 'running' && phase === 'learning') {
      sessionPlayer.loop = true;
      sessionPlayer.seekTo(0);
      sessionPlayer.play();
    } else {
      sessionPlayer.pause();
    }
  }, [phase, status, sessionAudioUri, sessionPlayer]);

  // 완료 시 세션을 store에 저장
  useEffect(() => {
    if (status !== 'completed') return;
    const meta = sessionMetaRef.current;
    if (!meta) return;
    const endedAt = new Date().toISOString();
    const session = createTrainingSession(
      {
        wordId: meta.wordId,
        sourceType: meta.sourceType,
        totalDurationSeconds: meta.totalDurationSeconds,
        learningDurationSeconds: meta.learningDurationSeconds,
        restDurationSeconds: meta.restDurationSeconds,
        completedCycles: totalCycles,
        totalLearningSeconds: totalCycles * meta.learningDurationSeconds,
        startedAt: meta.startedAt,
        endedAt,
      } satisfies CreateTrainingSessionInput,
      endedAt
    );
    saveCompletedSession(session);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // totalCycles/saveCompletedSession은 세션 중 불변

  async function saveSessionSetup(): Promise<{ wordId: string; settings: TrainingSessionSettings } | null> {
    if (!isHydrated) {
      setSaveErrorMessage(t('sessionSetup.storeLoading'));
      return null;
    }
    if (!canContinue) {
      setSaveErrorMessage(t('sessionSetup.selectAudioError'));
      return null;
    }
    try {
      const nowIso = new Date().toISOString();
      const pitchTransform = createMvpPitchTransform(nowIso) as AudioPitchTransform;

      let audioUri: string;
      let label: string;
      let presetKey: string | undefined;
      let sourceType: TrainingAudioSourceType;

      if (audioSource === 'preset') {
        audioUri = `preset://${selectedPreset.word}`;
        label = selectedPreset.word;
        presetKey = selectedPreset.key;
        sourceType = 'preset';
      } else {
        audioUri = recordingFile!.uri;
        label = recordingFile!.fileName;
        presetKey = undefined;
        sourceType = 'recording';
      }

      const word = createTrainingWord(
        { audioUri, locale, label, presetKey, sourceType, pitchTransform },
        nowIso
      );
      const settings: TrainingSessionSettings = {
        learningDurationSeconds: learnSecs,
        restDurationSeconds: restSecs,
        sourceType,
        totalDurationSeconds: sessionMins * 60,
        wordId: word.id,
      };
      await upsertWord(word);
      await saveLastSessionSettings(settings);
      setSaveErrorMessage(null);
      return { wordId: word.id, settings };
    } catch {
      setSaveErrorMessage(t('sessionSetup.saveError'));
      return null;
    }
  }

  async function handleStartSession() {
    const result = await saveSessionSetup();
    if (!result) return;
    sessionMetaRef.current = {
      wordId: result.wordId,
      startedAt: new Date().toISOString(),
      sourceType: result.settings.sourceType,
      totalDurationSeconds: result.settings.totalDurationSeconds,
      learningDurationSeconds: result.settings.learningDurationSeconds,
      restDurationSeconds: result.settings.restDurationSeconds,
    };
    setCycle(1);
    setPhase('learning');
    setPhaseElapsed(0);
    setStatus('running');
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const insets = useSafeAreaInsets();

  return (
    <>
      {/* ── Running view (modal overlay) ─────────────────────────── */}
      <Modal visible={status !== 'idle'} animationType="fade" statusBarTranslucent>
        <View style={[runStyles.container, { paddingTop: insets.top }]}>

          {/* ── Completion screen ── */}
          {status === 'completed' && (
            <View style={runStyles.completedContainer}>
              <Text style={runStyles.completedTitle}>세션 완료!</Text>
              <Text style={runStyles.completedWord}>{currentWord}</Text>
              <Text style={runStyles.completedStat}>{totalCycles}사이클 완료</Text>
              <Text style={runStyles.completedStat}>총 학습 시간 {fmt(totalCycles * learnSecs)}</Text>
              <Pressable
                style={runStyles.completedBtn}
                onPress={() => { sessionMetaRef.current = null; setStatus('idle'); }}
              >
                <Text style={runStyles.completedBtnText}>확인</Text>
              </Pressable>
            </View>
          )}

          {/* ── Running session UI ── */}
          {status !== 'completed' && <>

          {/* radial gradient overlay */}
          <View
            style={[
              runStyles.gradientOverlay,
              { backgroundColor: isLearning ? 'rgba(42,157,143,0.22)' : 'rgba(244,162,97,0.18)' },
            ]}
          />

          {/* header */}
          <View style={runStyles.header}>
            <Text style={runStyles.headerMono}>
              {sessionMins}분 세션 · {cycle} / {totalCycles} 사이클
            </Text>
            <Pressable style={runStyles.stopBtn} onPress={() => setStatus('idle')}>
              <Text style={runStyles.stopBtnText}>중단</Text>
            </Pressable>
          </View>

          {/* phase badge */}
          <View style={runStyles.badgeRow}>
            <View
              style={[
                runStyles.badge,
                {
                  backgroundColor: isLearning ? 'rgba(42,157,143,0.20)' : 'rgba(244,162,97,0.20)',
                  borderColor: isLearning ? 'rgba(42,157,143,0.45)' : 'rgba(244,162,97,0.45)',
                },
              ]}
            >
              <View
                style={[
                  runStyles.badgeDot,
                  { backgroundColor: isLearning ? '#7DD3C0' : '#F4A261' },
                ]}
              />
              <Text style={[runStyles.badgeText, { color: isLearning ? '#7DD3C0' : '#F4A261' }]}>
                {isLearning ? '학습 중' : '휴식 중'}
              </Text>
            </View>
          </View>

          {/* circular progress */}
          <View style={runStyles.progressWrapper}>
            <Svg width={240} height={240}>
              <Circle cx={120} cy={120} r={96} stroke="rgba(255,255,255,0.07)" strokeWidth={5} fill="none" />
              <Circle
                cx={120}
                cy={120}
                r={96}
                stroke={isLearning ? '#7DD3C0' : '#F4A261'}
                strokeWidth={5}
                fill="none"
                strokeDasharray={`${phaseProgress * circum} ${circum}`}
                strokeLinecap="round"
                transform={`rotate(-90 120 120)`}
              />
            </Svg>
            <View style={runStyles.progressCenter}>
              <Text style={runStyles.wordText}>{currentWord}</Text>
              <Text style={[runStyles.timerText, { color: isLearning ? '#7DD3C0' : '#F4A261' }]}>
                {fmt(phaseRemaining)}
              </Text>
            </View>
          </View>

          {/* waveform + auto-sound badge */}
          <View style={runStyles.waveSection}>
            <View
              style={[
                runStyles.autoBadge,
                {
                  backgroundColor: isLearning ? 'rgba(42,157,143,0.15)' : 'rgba(255,255,255,0.05)',
                  borderColor: isLearning ? 'rgba(42,157,143,0.35)' : 'rgba(255,255,255,0.1)',
                },
              ]}
            >
              <Text style={[runStyles.autoBadgeText, { color: isLearning ? '#7DD3C0' : 'rgba(255,255,255,0.4)' }]}>
                {isLearning ? '소리 자동 재생 중' : '휴식 중 · 다음 학습 준비'}
              </Text>
            </View>
            <WaveformBars color={isLearning ? '#7DD3C0' : 'rgba(255,255,255,0.2)'} height={40} barCount={44} />
          </View>

          {/* controls */}
          <View style={[runStyles.controls, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={runStyles.playPauseBtn}
              onPress={() => setStatus(status === 'running' ? 'paused' : 'running')}
            >
              <IconSymbol
                name={status === 'running' ? 'pause.fill' : 'play.fill'}
                style={runStyles.playPauseIcon} color={'rgba(174, 190, 192, 0.8)'} size={20}           
              />
            </Pressable>
            <View style={runStyles.cycleDots}>
              {Array.from({ length: Math.min(totalCycles, 24) }, (_, i) => (
                <View
                  key={i}
                  style={[
                    runStyles.dot,
                    {
                      backgroundColor:
                        i < cycle - 1
                          ? '#7DD3C0'
                          : i === cycle - 1
                          ? isLearning
                            ? '#7DD3C0'
                            : '#F4A261'
                          : 'rgba(255,255,255,0.15)',
                    },
                  ]}
                />
              ))}
              {totalCycles > 24 && (
                <Text style={runStyles.dotOverflow}>+{totalCycles - 24}</Text>
              )}
            </View>
          </View>
          </>}
        </View>
      </Modal>

      {/* ── Setup view ───────────────────────────────────────────── */}
      <PetScreen contentStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('sessionSetup.kicker')}</Text>
          <Text style={styles.title}>{t('sessionSetup.title')}</Text>
          <Text style={styles.body}>{t('sessionSetup.body')}</Text>
        </View>

        {/* Audio source toggle */}
        <View style={styles.sourceToggleRow}>
          <Text style={styles.wordSectionKicker}>{t('sessionSetup.sourceLabel')}</Text>
          <View style={styles.segmented}>
            <Pressable
              style={[styles.segmentBtn, audioSource === 'preset' && styles.segmentBtnActive]}
              onPress={() => { setAudioSource('preset'); resetRecording(); }}
            >
              <Text style={[styles.segmentLabel, audioSource === 'preset' && styles.segmentLabelActive]}>
                {t('sessionSetup.presetSource')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentBtn, audioSource === 'recording' && styles.segmentBtnActive]}
              onPress={() => setAudioSource('recording')}
            >
              <Text style={[styles.segmentLabel, audioSource === 'recording' && styles.segmentLabelActive]}>
                {t('sessionSetup.recordingSource')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Cycle math summary */}
        <CycleSummary
          sessionMins={sessionMins}
          learnSecs={learnSecs}
          restSecs={restSecs}
          totalCycles={totalCycles}
        />

        {/* Sliders */}
        <Card style={styles.sliderCard}>
          <SliderField
            label="총 세션 시간"
            value={`${sessionMins}분`}
            min={5}
            max={60}
            step={STEP_SESSION_MINS}
            current={sessionMins}
            color={PetHubColors.primary}
            onChange={(v) => setSessionMins(Math.round(v / STEP_SESSION_MINS) * STEP_SESSION_MINS)}
          />
          <SliderField
            label="학습 시간"
            value={`${learnSecs}초`}
            min={20}
            max={120}
            step={STEP_LEARN_SECS}
            current={learnSecs}
            color={PetHubColors.secondary}
            onChange={(v) => setLearnSecs(Math.round(v / STEP_LEARN_SECS) * STEP_LEARN_SECS)}
          />
          <SliderField
            label="휴식 시간"
            value={`${restSecs}초`}
            min={10}
            max={60}
            step={STEP_REST_SECS}
            current={restSecs}
            color={PetHubColors.accentCoral}
            onChange={(v) => setRestSecs(Math.round(v / STEP_REST_SECS) * STEP_REST_SECS)}
          />
          <Text style={styles.cycleMono}>
            1사이클 = {learnSecs}초 학습 + {restSecs}초 휴식 ({learnSecs + restSecs}초)
          </Text>
        </Card>

        {/* Word / Recording selection */}
        {audioSource === 'preset' && (
          <View style={styles.wordSection}>
            <View style={styles.wordSectionHead}>
              <Text style={styles.wordSectionKicker}>학습할 단어</Text>
            </View>
            {PRESET_WORDS.map((w) => (
              <PresetWordCard
                key={w.key}
                word={w}
                active={selectedPresetKey === w.key}
                onSelect={() => setSelectedPresetKey(w.key)}
                sessionCount={getPresetSessions(w.key)}
              />
            ))}
          </View>
        )}

        {audioSource === 'recording' && (
          <Card style={styles.sliderCard}>
            <Text style={styles.wordSectionKicker}>{t('sessionSetup.recordingLabel')}</Text>
            <Text style={styles.bodySmall}>{t('sessionSetup.recordingBody')}</Text>
            <WaveformPlaceholder
              metering={metering}
              state={
                recordingLifecycle === 'recording' ? 'recording'
                : recordingLifecycle === 'recorded' ? 'recorded'
                : 'idle'
              }
              statusLabel={
                recordingLifecycle === 'recording' ? t('sessionSetup.recordingStatus')
                : recordingLifecycle === 'recorded' ? t('sessionSetup.recordedStatus')
                : undefined
              }
            />
            <View style={styles.recorderBtns}>
              {(recordingLifecycle === 'idle' || recordingLifecycle === 'error' || recordingLifecycle === 'requesting-permission') && (
                <PillButton
                  disabled={recordingLifecycle === 'requesting-permission'}
                  full
                  label={t('sessionSetup.startRecording')}
                  onPress={requestAndStartRecording}
                  variant="teal"
                />
              )}
              {recordingLifecycle === 'recording' && (
                <PillButton
                  full
                  label={t('sessionSetup.stopRecording')}
                  onPress={stopRecording}
                  variant="primary"
                />
              )}
              {recordingLifecycle === 'recorded' && (
                <PillButton
                  full
                  label={t('sessionSetup.rerecord')}
                  onPress={resetRecording}
                  variant="ghost"
                />
              )}
            </View>
            {recordingErrorMessage ? <Text style={styles.error}>{recordingErrorMessage}</Text> : null}
          </Card>
        )}

        {audioSource === 'recording' && (
          <Card style={styles.freqCard}>
            <Text style={styles.wordSectionKicker}>고주파 톤 매핑 · 목표 주파수</Text>
            <FreqBandViz low={1} high={target} color={PetHubColors.secondary} label={`${target.toFixed(1)} kHz`} />
            <Slider
              style={styles.freqSlider}
              minimumValue={1.5}
              maximumValue={4.0}
              step={0.1}
              value={target}
              minimumTrackTintColor={PetHubColors.secondary}
              maximumTrackTintColor="rgba(31,58,61,0.12)"
              thumbTintColor={PetHubColors.secondary}
              onValueChange={(v) => setTarget(Math.round(v * 10) / 10)}
            />
            <View style={styles.personaRow}>
              {PERSONAS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.75}
                  style={[styles.personaBtn, persona === p.id && styles.personaBtnActive]}
                  onPress={() => setPersona(p.id)}
                >
                  <Text style={[styles.personaLabel, persona === p.id && styles.personaLabelActive]}>{p.label}</Text>
                  <Text style={styles.personaRange}>{p.range}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {!isHydrated ? <Text style={styles.bodySmall}>{t('sessionSetup.storeLoading')}</Text> : null}
        {trainingErrorMessage ? <Text style={styles.error}>{trainingErrorMessage}</Text> : null}
        {saveErrorMessage ? <Text style={styles.error}>{saveErrorMessage}</Text> : null}

        <PillButton
          disabled={!canContinue}
          full
          label={
            audioSource === 'preset'
              ? `세션 시작 · "${selectedPreset.word}" · ${totalCycles}사이클`
              : `세션 시작 · 녹음 파일 · ${totalCycles}사이클`
          }
          onPress={handleStartSession}
          size="lg"
          variant="teal"
        />
      </PetScreen>
    </>
  );
}

// ── Word select card ──────────────────────────────────────────────────────────

function PresetWordCard({ word, active, onSelect, sessionCount }: {
  word: PresetWord; active: boolean; onSelect: () => void; sessionCount: number;
}) {
  const timeLabel = `${sessionCount} 세션`;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onSelect} style={[presetStyles.card, active && presetStyles.cardActive]}>
      <View style={presetStyles.row}>
        <View style={presetStyles.textBlock}>
          <Text style={[presetStyles.phrase, active && presetStyles.phraseActive]}>{word.word}</Text>
          <Text style={[presetStyles.cat, active && presetStyles.catActive]}>{word.cat}</Text>
        </View>
        <Text style={[presetStyles.time, active && presetStyles.timeActive]}>{timeLabel}</Text>
        <View style={[presetStyles.radio, active && presetStyles.radioActive]}>
          {active && <View style={presetStyles.radioDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const presetStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(31,58,61,0.08)',
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 14,
  },
  cardActive: {
    backgroundColor: PetHubColors.primary,
    borderWidth: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  textBlock: {
    alignItems: 'baseline',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  phrase: {
    color: PetHubColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  phraseActive: { color: '#FAF6F0' },
  cat: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
  },
  catActive: { color: 'rgba(250,246,240,0.55)' },
  time: {
    color: 'rgba(31,58,61,0.45)',
    fontSize: 11,
    fontWeight: '500',
  },
  timeActive: { color: 'rgba(250,246,240,0.55)' },
  radio: {
    alignItems: 'center',
    borderColor: 'rgba(31,58,61,0.2)',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioActive: {
    backgroundColor: PetHubColors.secondary,
    borderWidth: 0,
  },
  radioDot: {
    backgroundColor: '#fff',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});

// ── Cycle summary banner ──────────────────────────────────────────────────────

function CycleSummary({ sessionMins, learnSecs, restSecs, totalCycles }: { sessionMins: number; learnSecs: number; restSecs: number; totalCycles: number }) {
  return (
    <View style={summaryStyles.row}>
      <View style={[summaryStyles.cell, summaryStyles.cellDark]}>
        <Text style={[summaryStyles.value, summaryStyles.valueDark]}>{sessionMins}분</Text>
        <Text style={[summaryStyles.label, summaryStyles.labelDark]}>총 세션 시간</Text>
      </View>
      <View style={[summaryStyles.cell, summaryStyles.cellTeal]}>
        <Text style={[summaryStyles.value, summaryStyles.valueTeal]}>{learnSecs}초</Text>
        <Text style={[summaryStyles.label, summaryStyles.labelTeal]}>학습</Text>
      </View>
      <View style={[summaryStyles.cell, summaryStyles.cellCoral]}>
        <Text style={[summaryStyles.value, summaryStyles.valueCoral]}>{restSecs}초</Text>
        <Text style={[summaryStyles.label, summaryStyles.labelCoral]}>휴식</Text>
      </View>
      <View style={[summaryStyles.cell, summaryStyles.cellCream]}>
        <Text style={[summaryStyles.value, summaryStyles.valueCream]}>{totalCycles}</Text>
        <Text style={[summaryStyles.label, summaryStyles.labelCream]}>사이클</Text>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    borderColor: 'rgba(31,58,61,0.08)',
    borderRadius: 20,
    borderWidth: 0.5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cell: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 14,
  },
  cellDark: { backgroundColor: PetHubColors.primary },
  cellTeal: { backgroundColor: PetHubColors.secondary },
  cellCoral: { backgroundColor: PetHubColors.accentCoral },
  cellCream: { backgroundColor: '#FAF6F0' },
  value: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  valueDark: { color: '#FAF6F0' },
  valueTeal: { color: '#FAF6F0' },
  valueCoral: { color: '#FAF6F0' },
  valueCream: { color: PetHubColors.primary },
  label: { fontSize: 9, fontWeight: '500', letterSpacing: 0.5, marginTop: 2, opacity: 0.65 },
  labelDark: { color: '#FAF6F0' },
  labelTeal: { color: '#FAF6F0' },
  labelCoral: { color: '#FAF6F0' },
  labelCream: { color: PetHubColors.primary },
});

// ── Slider field ──────────────────────────────────────────────────────────────

function SliderField({ label, value, min, max, step, current, color, onChange }: {
  label: string; value: string; min: number; max: number; step: number; current: number; color: string; onChange: (v: number) => void;
}) {
  return (
    <View style={sliderStyles.field}>
      <View style={sliderStyles.row}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={[sliderStyles.value, { color }]}>{value}</Text>
      </View>
      <Slider
        style={sliderStyles.slider}
        minimumValue={min}
        maximumValue={max}
        value={current}
        step={step}
        minimumTrackTintColor={color}
        maximumTrackTintColor="rgba(31,58,61,0.12)"
        thumbTintColor={color}
        onValueChange={onChange}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  field: { gap: 2 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: 'rgba(31,58,61,0.7)', fontSize: 13, fontWeight: '500' },
  value: { fontSize: 13, fontWeight: '700' },
  slider: { height: 36, width: '100%' },
});

// ── Running view styles ───────────────────────────────────────────────────────

const runStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0F1A1B',
    flex: 1,
  },
  gradientOverlay: {
    borderRadius: 999,
    height: 300,
    left: '50%',
    marginLeft: -150,
    marginTop: -60,
    position: 'absolute',
    top: 0,
    width: 300,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  headerMono: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
  stopBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stopBtnText: {
    color: '#FAF6F0',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  badgeDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  progressWrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  progressCenter: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  wordText: {
    color: '#FAF6F0',
    fontSize: 60,
    fontWeight: '700',
    letterSpacing: -2,
    textAlign: 'center',
  },
  timerText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 10,
  },
  waveSection: {
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 22,
  },
  autoBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  playPauseBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  playPauseIcon: {
    color: '#FAF6F0',
    fontSize: 20,
  },
  cycleDots: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center',
    maxWidth: 180,
  },
  dot: {
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  dotOverflow: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
  },
  completedContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  completedTitle: {
    color: '#7DD3C0',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  completedWord: {
    color: '#FAF6F0',
    fontSize: 60,
    fontWeight: '700',
    letterSpacing: -2,
  },
  completedStat: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '500',
  },
  completedBtn: {
    backgroundColor: 'rgba(125,211,192,0.20)',
    borderColor: 'rgba(125,211,192,0.45)',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  completedBtnText: {
    color: '#7DD3C0',
    fontSize: 16,
    fontWeight: '700',
  },
});

// ── Main screen styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sectionY,
  },
  header: {
    gap: Spacing.sectionHeadGap,
  },
  kicker: {
    color: PetHubColors.secondaryDeep,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  title: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
  },
  body: {
    ...Typography.body,
    color: 'rgba(31,58,61,0.68)',
  },
  bodySmall: {
    ...Typography.bodySmall,
    color: 'rgba(31,58,61,0.64)',
  },
  sliderCard: {
    gap: Spacing.sectionHeadGap,
  },
  cycleMono: {
    color: 'rgba(31,58,61,0.45)',
    fontSize: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  sourceToggleRow: {
    gap: Spacing.micro,
  },
  segmented: {
    backgroundColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.full,
    flexDirection: 'row',
    padding: 3,
  },
  segmentBtn: {
    alignItems: 'center',
    borderRadius: Radii.full,
    flex: 1,
    paddingVertical: 7,
  },
  segmentBtnActive: {
    backgroundColor: PetHubColors.secondary,
  },
  segmentLabel: {
    color: 'rgba(31,58,61,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: '#FAF6F0',
  },
  recorderBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  wordSection: {
    gap: 8,
  },
  wordSectionHead: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  wordSectionKicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  wordSectionTitle: {
    ...Typography.body,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  error: {
    ...Typography.bodySmall,
    color: PetHubColors.accentCoral,
    fontWeight: '700',
  },
  freqCard: {
    gap: 14,
  },
  freqSlider: {
    height: 36,
    width: '100%',
  },
  personaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  personaBtn: {
    backgroundColor: '#fff',
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.field,
    borderWidth: 0.5,
    flex: 1,
    gap: 2,
    minWidth: 90,
    padding: 10,
  },
  personaBtnActive: {
    backgroundColor: 'rgba(42,157,143,0.08)',
    borderColor: PetHubColors.secondary,
    borderWidth: 1.5,
  },
  personaLabel: {
    color: PetHubColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  personaLabelActive: {
    color: PetHubColors.secondary,
  },
  personaRange: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
