import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Rect, Svg } from 'react-native-svg';

import { WaveformPlaceholder } from '@/components/audio/waveform-placeholder';
import { Card } from '@/components/ui/card';
import { FreqBandViz } from '@/components/ui/freq-band-viz';
import { PillButton } from '@/components/ui/pill-button';
import { WaveformBars } from '@/components/ui/waveform-bars';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAudioRecording } from '@/features/audio/use-audio-recording';

const PERSONAS = [
  { id: 'child', label: '아이 톤', range: '2.5–3.5 kHz' },
  { id: 'female', label: '여성 톤', range: '1.5–2.5 kHz' },
  { id: 'bird', label: '새 모방 톤', range: '3.5–4.0 kHz' },
] as const;

type PersonaId = (typeof PERSONAS)[number]['id'];

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const { isRecording, lifecycle, metering, errorMessage, requestAndStartRecording, stopRecording } = useAudioRecording({
    permissionDeniedMessage: '마이크 권한이 필요합니다',
    saveFailedMessage: '녹음 저장에 실패했습니다',
    startFailedMessage: '녹음 시작에 실패했습니다',
    tooShortMessage: '녹음이 너무 짧습니다',
    minDurationMs: 1_000,
  });
  const [target, setTarget] = useState(2.8);
  const [persona, setPersona] = useState<PersonaId>('child');

  const hasClip = lifecycle === 'recorded';
  const currentPersona = PERSONAS.find((p) => p.id === persona)!

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: insets.bottom + Spacing.screenBottomTabs },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.kicker}>VOICE CONVERSION · RVC</Text>
        <Text style={styles.title}>내 목소리, 앵무새 톤으로</Text>
        <Text style={styles.body}>녹음하면 AI가 앵무새가 가장 잘 따라하는 고주파로 변환해요.</Text>
      </View>

      {/* recorder dark card */}
      <View style={styles.recorderCard}>
        <View style={styles.recorderInner}>
          <Text style={styles.recorderMono}>WORD · 녹음할 단어</Text>
          <Text style={styles.recorderWord}>{'"사과"'}</Text>
          <WaveformPlaceholder
            state={isRecording ? 'recording' : lifecycle === 'recorded' ? 'recorded' : 'idle'}
            metering={metering}
          />
          <View style={styles.micRow}>
            <Pressable
              style={[styles.micBtn, isRecording && styles.micBtnRecording]}
              onPress={() => isRecording ? stopRecording() : requestAndStartRecording()}
            >
              {isRecording ? (
                <View style={styles.stopRect} />
              ) : (
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#1F3A3D" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="9" y="3" width="6" height="12" rx="3" />
                  <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </Svg>
              )}
            </Pressable>
          </View>
          <Text style={styles.recorderStatus}>
            {isRecording ? '녹음 중...' : lifecycle === 'error' ? errorMessage : lifecycle === 'recorded' ? '녹음 완료' : '버튼을 눌러 녹음을 시작하세요'}
          </Text>
        </View>
      </View>

      {/* before/after compare */}
      {hasClip && (
        <View style={styles.compareSection}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionKicker}>원본 vs 변환</Text>
            <Text style={styles.sectionTitle}>비교 청취</Text>
          </View>
          {[
            { label: '원본', sub: '220 Hz · 일반 보이스', color: '#9CB0B2', active: false },
            { label: '변환', sub: `${target.toFixed(1)} kHz · ${currentPersona.label}`, color: PetHubColors.secondary, active: true },
          ].map((r) => (
            <View key={r.label} style={styles.compareCard}>
              <Pressable style={[styles.playBtn, r.active && styles.playBtnActive]}>
                <Text style={[styles.playBtnIcon, r.active && styles.playBtnIconActive]}>▶</Text>
              </Pressable>
              <View style={styles.compareInfo}>
                <Text style={styles.compareLabel}>{r.label}</Text>
                <Text style={styles.compareSub}>{r.sub}</Text>
              </View>
              <View style={styles.compareWave}>
                <WaveformBars color={r.color} height={28} barCount={20} />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* freq target */}
      <View style={styles.freqSection}>
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionKicker}>고주파 톤 매핑</Text>
          <Text style={styles.sectionTitle}>목표 주파수</Text>
        </View>
        <Card style={styles.freqCard}>
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
      </View>

      {/* bottom buttons */}
      <View style={styles.bottomBtns}>
        <PillButton style={{ flex: 1 }} label="저장만" variant="ghost" onPress={() => {}} />
        <PillButton style={{ flex: 1 }} label="학습에 추가" variant="teal" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: PetHubColors.neutral,
    flex: 1,
  },
  content: {
    gap: Spacing.sectionY,
    paddingHorizontal: Spacing.screenX,
  },
  header: {
    gap: Spacing.sectionHeadGap,
  },
  kicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  title: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
  },
  body: {
    ...Typography.body,
    color: 'rgba(31,58,61,0.6)',
  },
  recorderCard: {
    backgroundColor: PetHubColors.primary,
    borderRadius: Radii.heroCard,
    overflow: 'hidden',
    shadowColor: 'rgba(31,58,61,1)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
  },
  recorderInner: {
    gap: 14,
    padding: 22,
  },
  recorderMono: {
    color: 'rgba(250,246,240,0.7)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  recorderWord: {
    color: '#FAF6F0',
    fontSize: 36,
    fontWeight: '700',
  },
  micRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  micBtn: {
    alignItems: 'center',
    backgroundColor: PetHubColors.feather,
    borderRadius: Radii.full,
    height: 72,
    justifyContent: 'center',
    shadowColor: 'rgba(252,239,216,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    width: 72,
  },
  micBtnRecording: {
    backgroundColor: '#E76F51',
    shadowColor: 'rgba(231,111,81,1)',
    shadowOpacity: 0.25,
  },
  stopRect: {
    backgroundColor: '#fff',
    borderRadius: 5,
    height: 22,
    width: 22,
  },
  recorderStatus: {
    color: 'rgba(250,246,240,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  compareSection: {
    gap: 10,
  },
  sectionHeadRow: {
    gap: 4,
    marginBottom: 2,
  },
  sectionKicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    ...Typography.body,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  compareCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.listItem,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  playBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,58,61,0.08)',
    borderRadius: Radii.full,
    flexShrink: 0,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  playBtnActive: {
    backgroundColor: PetHubColors.secondary,
  },
  playBtnIcon: {
    color: PetHubColors.primary,
    fontSize: 12,
    marginLeft: 2,
  },
  playBtnIconActive: {
    color: '#fff',
  },
  compareInfo: {
    flex: 1,
    gap: 2,
  },
  compareLabel: {
    color: PetHubColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  compareSub: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  compareWave: {
    flexShrink: 0,
    width: 110,
  },
  freqSection: {
    gap: 10,
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
  bottomBtns: {
    paddingTop: 20,
    paddingRight: 22,
    paddingBottom: 120,
    paddingLeft: 0,

    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
});
