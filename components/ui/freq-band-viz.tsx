import { StyleSheet, Text, View } from 'react-native';

const TICKS = [0, 2, 4, 6, 8]; // 1 ~ 5 범위로 수정해야합니다.

interface FreqBandVizProps {
  low: number;
  high: number;
  color?: string;
  label?: string;
}

export function FreqBandViz({ low, high, color = '#2A9D8F', label }: FreqBandVizProps) {
  const max = 8;
  const lowPct = (low / max) * 100;
  const highPct = (high / max) * 100;
  const widthPct = highPct - lowPct;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { left: `${lowPct}%` as any, width: `${widthPct}%` as any, backgroundColor: color }]} />
        {TICKS.map((t) => (
          <View key={t} style={[styles.tick, { left: `${(t / max) * 100}%` as any }]} />
        ))}
      </View>
      <View style={styles.labels}>
        {TICKS.map((t) => (
          <Text key={t} style={styles.tickLabel}>{t}</Text>
        ))}
      </View>
      <Text style={styles.rangeLabel}>
        {label ?? `${low.toFixed(1)}–${high.toFixed(1)} kHz`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  track: {
    backgroundColor: 'rgba(31,58,61,0.08)',
    borderRadius: 6,
    height: 12,
    position: 'relative',
  },
  fill: {
    borderRadius: 6,
    bottom: 0,
    position: 'absolute',
    top: 0,
  },
  tick: {
    backgroundColor: 'rgba(31,58,61,0.2)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tickLabel: {
    color: 'rgba(31,58,61,0.45)',
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  rangeLabel: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
