import { Picker } from "@react-native-picker/picker"
import { Platform, StyleSheet, View } from "react-native"

import { colors, font } from "@/theme"

export function Wheel({
  value,
  values,
  onChange,
  label,
  testID,
}: {
  value: number
  values: readonly number[]
  onChange(value: number): void
  label: string
  testID: string
}) {
  return (
    <View style={styles.container}>
      <Picker
        testID={testID}
        accessibilityLabel={label}
        selectedValue={value}
        onValueChange={(next) => onChange(Number(next))}
        itemStyle={styles.item}
        style={styles.picker}
        dropdownIconColor={colors.text}
      >
        {values.map((item) => (
          <Picker.Item key={item} label={String(item)} value={item} color={colors.text} />
        ))}
      </Picker>
      {Platform.OS === "ios" ? <View pointerEvents="none" style={styles.selection} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", minWidth: 64 },
  picker: { width: "100%", color: colors.text },
  item: { fontFamily: font.extraBold, fontSize: 23, height: 180 },
  selection: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    height: 40,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.orange,
  },
})
