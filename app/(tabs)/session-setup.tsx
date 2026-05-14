import Slider from '@react-native-community/slider';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Svg } from 'react-native-svg';

import { PetScreen } from '@/components/layout/pet-screen';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PillButton } from '@/components/ui/pill-button';
import { WaveformBars } from '@/components/ui/waveform-bars';
import { PetHubColors, Spacing, Typography } from '@/constants/theme';
import { createMvpPitchTransform } from '@/features/audio/pitch-profile';
import { useI18n } from '@/features/i18n/i18n-context';
import { useTrainingData } from '@/features/training/training-context';
import { createTrainingWord } from '@/features/training/training-model';
import type { AudioPitchTransform, TrainingSessionSettings } from '@/features/training/training-types';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

type SessionStatus = 'idle' | 'running' | 'paused';

const STEP_SESSION_MINS = 5;
const STEP_LEARN_SECS = 10;
const STEP_REST_SECS = 5;

export default function SessionSetupScreen() {
  const { locale, t } = useI18n();
  const { errorMessage: trainingErrorMessage, isHydrated, saveLastSessionSettings, upsertWord } = useTrainingData();
  const { entries, isHydrated: libraryHydrated } = useWordLibrary();
  const { wordId: wordIdParam } = useLocalSearchParams<{ wordId?: string }>();

  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [sessionMins, setSessionMins] = useState(20);
  const [learnSecs, setLearnSecs] = useState(60);
  const [restSecs, setRestSecs] = useState(30);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (wordIdParam && entries.some((e) => e.id === wordIdParam)) {
      setSelectedWordId(wordIdParam);
    } else if (entries.length > 0 && selectedWordId === null) {
      setSelectedWordId(entries[0].id);
    }
  }, [wordIdParam, entries, selectedWordId]);

  const [status, setStatus] = useState<SessionStatus>('idle');
  const [phase, setPhase] = useState<'learning' | 'rest'>('learning');
  const [cycle, setCycle] = useState(1);
  const [phaseElapsed, setPhaseElapsed] = useState(0);

  const secsPerCycle = learnSecs + restSecs;
  const totalCycles = Math.max(1, Math.floor((sessionMins * 60) / secsPerCycle));
  const selectedEntry: WordEntry | undefined = entries.find((e) => e.id === selectedWordId);
  const currentWord = selectedEntry?.label ?? '';
  const isLearning = phase === 'learning';
  const phaseDuration = isLearning ? learnSecs : restSecs;
  const phaseRemaining = Math.max(0, phaseDuration - phaseElapsed);
  const phaseProgress = Math.min(1, phaseElapsed / Math.max(1, phaseDuration));
  const circum = 2 * Math.PI * 96;

  const canContinue = isHydrated && libraryHydrated && selectedWordId !== null && entries.length > 0;

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
          setStatus('idle');
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

  async function saveSessionSetup(): Promise<boolean> {
    if (!isHydrated || !selectedEntry) {
      setSaveErrorMessage(t('sessionSetup.storeLoading'));
      return false;
    }
    try {
      const nowIso = new Date().toISOString();
      const pitchTransform = createMvpPitchTransform(nowIso) as AudioPitchTransform;
      const word = createTrainingWord(
        {
          audioUri: selectedEntry.audioUri,
          locale,
          label: selectedEntry.label,
          presetKey: selectedEntry.presetKey,
          sourceType: selectedEntry.sourceType,
          pitchTransform,
        },
        nowIso
      );
      const settings: TrainingSessionSettings = {
        learningDurationSeconds: learnSecs,
        restDurationSeconds: restSecs,
        sourceType: selectedEntry.sourceType,
        totalDurationSeconds: sessionMins * 60,
        wordId: word.id,
      };
      await upsertWord(word);
      await saveLastSessionSettings(settings);
      setSaveErrorMessage(null);
      return true;
    } catch {
      setSaveErrorMessage(t('sessionSetup.saveError'));
      return false;
    }
  }

  async function handleStartSession() {
    const ok = await saveSessionSetup();
    if (!ok) return;
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
      {/* ── 실행 중 모달 ───────────────────────────────────────────── */}
      <Modal visible={status !== 'idle'} animationType="fade" statusBarTranslucent>
        <View style={[runStyles.container, { paddingTop: insets.top }]}>
          <View
            style={[
              runStyles.gradientOverlay,
              { backgroundColor: isLearning ? 'rgba(42,157,143,0.22)' : 'rgba(244,162,97,0.18)' },
            ]}
          />
          <View style={runStyles.header}>
            <Text style={runStyles.headerMono}>
              {sessionMins}분 세션 · {cycle} / {totalCycles} 사이클
            </Text>
            <Pressable style={runStyles.stopBtn} onPress={() => setStatus('idle')}>
              <Text style={runStyles.stopBtnText}>중단</Text>
            </Pressable>
          </View>
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
              <View style={[runStyles.badgeDot, { backgroundColor: isLearning ? '#7DD3C0' : '#F4A261' }]} />
              <Text style={[runStyles.badgeText, { color: isLearning ? '#7DD3C0' : '#F4A261' }]}>
                {isLearning ? '학습 중' : '휴식 중'}
              </Text>
            </View>
          </View>
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
          <View style={[runStyles.controls, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={runStyles.playPauseBtn}
              onPress={() => setStatus(status === 'running' ? 'paused' : 'running')}
            >
              <IconSymbol
                name={status === 'running' ? 'pause.fill' : 'play.fill'}
                style={runStyles.playPauseIcon}
                color={'rgba(174, 190, 192, 0.8)'}
                size={20}
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
              {totalCycles > 24 && <Text style={runStyles.dotOverflow}>+{totalCycles - 24}</Text>}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 설정 화면 ────────────────────────────────────────────── */}
      <PetScreen contentStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t('sessionSetup.kicker')}</Text>
          <Text style={styles.title}>{t('sessionSetup.title')}</Text>
          <Text style={styles.body}>{t('sessionSetup.body')}</Text>
        </View>

        <CycleSummary
          sessionMins={sessionMins}
          learnSecs={learnSecs}
          restSecs={restSecs}
          totalCycles={totalCycles}
        />

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

        {/* 단어 선택 */}
        {libraryHydrated && entries.length === 0 ? (
          <View style={styles.emptyLibrary}>
            <Text style={styles.emptyLibraryText}>{t('sessionSetupExtra.emptyLibrary')}</Text>
          </View>
        ) : (
          <View style={styles.wordSection}>
            <View style={styles.wordSectionHead}>
              <Text style={styles.wordSectionKicker}>학습할 단어</Text>
            </View>
            {entries.map((entry) => (
              <LibraryWordCard
                key={entry.id}
                entry={entry}
                active={selectedWordId === entry.id}
                onSelect={() => setSelectedWordId(entry.id)}
              />
            ))}
          </View>
        )}

        {!isHydrated ? <Text style={styles.bodySmall}>{t('sessionSetup.storeLoading')}</Text> : null}
        {trainingErrorMessage ? <Text style={styles.error}>{trainingErrorMessage}</Text> : null}
        {saveErrorMessage ? <Text style={styles.error}>{saveErrorMessage}</Text> : null}

        <PillButton
          disabled={!canContinue}
          full
          label={
            selectedEntry
              ? `세션 시작 · "${selectedEntry.label}" · ${totalCycles}사이클`
              : '세션 시작'
          }
          onPress={handleStartSession}
          size="lg"
          variant="teal"
        />
      </PetScreen>
    </>
  );
}

// ── 라이브러리 단어 카드 ─────────────────────────────────────────────────────────

function LibraryWordCard({ entry, active, onSelect }: {
  entry: WordEntry; active: boolean; onSelect: () => void;
}) {
  return (
    <Pressable onPress={onSelect} style={[presetStyles.card, active && presetStyles.cardActive]}>
      <View style={presetStyles.row}>
        <View style={presetStyles.textBlock}>
          <Text style={[presetStyles.phrase, active && presetStyles.phraseActive]}>{entry.label}</Text>
          <Text style={[presetStyles.cat, active && presetStyles.catActive]}>{entry.tag}</Text>
        </View>
        <View style={[presetStyles.radio, active && presetStyles.radioActive]}>
          {active && <View style={presetStyles.radioDot} />}
        </View>
      </View>
    </Pressable>
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
  cardActive: { backgroundColor: PetHubColors.primary, borderWidth: 0 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  textBlock: { alignItems: 'baseline', flex: 1, flexDirection: 'row', gap: 8 },
  phrase: { color: PetHubColors.primary, fontSize: 18, fontWeight: '700' },
  phraseActive: { color: '#FAF6F0' },
  cat: { color: 'rgba(31,58,61,0.55)', fontSize: 11 },
  catActive: { color: 'rgba(250,246,240,0.55)' },
  radio: { alignItems: 'center', borderColor: 'rgba(31,58,61,0.2)', borderRadius: 999, borderWidth: 1.5, height: 22, justifyContent: 'center', width: 22 },
  radioActive: { backgroundColor: PetHubColors.secondary, borderWidth: 0 },
  radioDot: { backgroundColor: '#fff', borderRadius: 999, height: 8, width: 8 },
});

// ── 사이클 요약 ──────────────────────────────────────────────────────────────────

function CycleSummary({ sessionMins, learnSecs, restSecs, totalCycles }: {
  sessionMins: number; learnSecs: number; restSecs: number; totalCycles: number;
}) {
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
  row: { borderColor: 'rgba(31,58,61,0.08)', borderRadius: 20, borderWidth: 0.5, flexDirection: 'row', overflow: 'hidden' },
  cell: { alignItems: 'center', flex: 1, paddingVertical: 14 },
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

// ── 슬라이더 필드 ─────────────────────────────────────────────────────────────────

function SliderField({ label, value, min, max, step, current, color, onChange }: {
  label: string; value: string; min: number; max: number; step: number; current: number; color: string;
  onChange: (v: number) => void;
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

// ── 실행 중 화면 스타일 ───────────────────────────────────────────────────────────

const runStyles = StyleSheet.create({
  container: { backgroundColor: '#0F1A1B', flex: 1 },
  gradientOverlay: { borderRadius: 999, height: 300, left: '50%', marginLeft: -150, marginTop: -60, position: 'absolute', top: 0, width: 300 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 16 },
  headerMono: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '500', letterSpacing: 0.8 },
  stopBtn: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  stopBtnText: { color: '#FAF6F0', fontSize: 12, fontWeight: '600' },
  badgeRow: { alignItems: 'center', marginTop: 16 },
  badge: { alignItems: 'center', borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 7 },
  badgeDot: { borderRadius: 999, height: 6, width: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
  progressWrapper: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  progressCenter: { alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  wordText: { color: '#FAF6F0', fontSize: 60, fontWeight: '700', letterSpacing: -2, textAlign: 'center' },
  timerText: { fontSize: 15, fontWeight: '600', letterSpacing: 0.5, marginTop: 10 },
  waveSection: { gap: 10, paddingBottom: 14, paddingHorizontal: 22 },
  autoBadge: { alignItems: 'center', alignSelf: 'center', borderRadius: 999, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 4 },
  autoBadgeText: { fontSize: 10, fontWeight: '500', letterSpacing: 0.4 },
  controls: { alignItems: 'center', flexDirection: 'row', gap: 24, justifyContent: 'center', paddingHorizontal: 22, paddingTop: 10 },
  playPauseBtn: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 999, height: 60, justifyContent: 'center', width: 60 },
  playPauseIcon: { color: '#FAF6F0', fontSize: 20 },
  cycleDots: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', maxWidth: 180 },
  dot: { borderRadius: 999, height: 9, width: 9 },
  dotOverflow: { color: 'rgba(255,255,255,0.45)', fontSize: 9 },
});

// ── 메인 화면 스타일 ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { gap: Spacing.sectionY },
  header: { gap: Spacing.sectionHeadGap },
  kicker: { color: PetHubColors.secondaryDeep, fontSize: 11, fontWeight: '700', letterSpacing: 4 },
  title: { ...Typography.screenTitle, color: PetHubColors.primary },
  body: { ...Typography.body, color: 'rgba(31,58,61,0.68)' },
  bodySmall: { ...Typography.bodySmall, color: 'rgba(31,58,61,0.64)' },
  sliderCard: { gap: Spacing.sectionHeadGap },
  cycleMono: { color: 'rgba(31,58,61,0.45)', fontSize: 10, letterSpacing: 0.3, textAlign: 'center' },
  wordSection: { gap: 8 },
  wordSectionHead: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  wordSectionKicker: { color: 'rgba(31,58,61,0.55)', fontSize: 11, fontWeight: '500', letterSpacing: 0.6 },
  emptyLibrary: { alignItems: 'center', backgroundColor: 'rgba(31,58,61,0.04)', borderRadius: 16, paddingVertical: 20, paddingHorizontal: 16 },
  emptyLibraryText: { ...Typography.bodySmall, color: 'rgba(31,58,61,0.55)', textAlign: 'center' },
  error: { ...Typography.bodySmall, color: PetHubColors.accentCoral, fontWeight: '700' },
});
