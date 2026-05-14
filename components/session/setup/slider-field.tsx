import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';

interface SliderFieldProps {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  color: string;
  onChange: (v: number) => void;
}

export function SliderField({ label, value, min, max, step, current, color, onChange }: SliderFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
      <Slider
        style={styles.slider}
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

const styles = StyleSheet.create({
  field: { gap: 2 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: 'rgba(31,58,61,0.7)', fontSize: 13, fontWeight: '500' },
  value: { fontSize: 13, fontWeight: '700' },
  slider: { height: 36, width: '100%' },
});
