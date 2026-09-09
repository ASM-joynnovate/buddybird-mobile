import { useCallback, useEffect, useRef, useState } from "react"
import { Alert, FlatList, ScrollView, StyleSheet, View } from "react-native"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio"
import { useTranslation } from "react-i18next"

import type { RootStackParamList } from "@/navigators/types"
import { useAppData } from "@/context/AppContext"
import { currentWord, Word } from "@/services/data"
import { removeWord, visibleWords } from "@/services/library"
import { resolveAudio } from "@/services/media"
import { screen, setUserProperties, track } from "@/services/telemetry"
import { Chip, Copy, IconButton, InlineError, Screen, Title, ui } from "@/components/ui"
import { colors, font } from "@/theme"

const filters = ["all", "greeting", "food", "name", "etc"] as const

export function WordsScreen() {
  const { t } = useTranslation()
  const data = useAppData()
  const words = visibleWords(data, data.settings.locale)
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  const [filter, setFilter] = useState<(typeof filters)[number]>("all")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const previewRequestId = useRef(0)
  const isFocused = useRef(false)
  const wordCount = useRef(words.length)

  wordCount.current = words.length

  const filteredWords = filter === "all" ? words : words.filter((word) => word.tag === filter)

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true
      screen("words")
      track("word_library_opened", { total_words_count: wordCount.current })

      return () => {
        isFocused.current = false
        previewRequestId.current++
        player.pause()
        setPlayingId(null)
      }
    }, [player]),
  )

  useEffect(() => {
    if (status.didJustFinish) {
      setPlayingId(null)
    }
  }, [status.didJustFinish])

  async function preview(word: Word) {
    const requestId = ++previewRequestId.current

    setError(null)

    if (playingId === word.id && status.playing) {
      player.pause()
      setPlayingId(null)
      track("word_library_preview_played", {
        word_id: word.id,
        word_name: word.label,
        source_type: word.sourceType,
        action: "stop",
      })

      return
    }

    player.pause()

    try {
      const uri = await resolveAudio(word)

      if (requestId !== previewRequestId.current || !isFocused.current) {
        return
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionMode: "doNotMix",
      })

      if (requestId !== previewRequestId.current || !isFocused.current) {
        return
      }

      player.replace({ uri })
      player.play()
      setPlayingId(word.id)

      track("word_library_preview_played", {
        word_id: word.id,
        word_name: word.label,
        source_type: word.sourceType,
        action: "play",
      })
    } catch {
      setError(t("words.playbackError"))
      setPlayingId(null)
    }
  }

  function deleteWord(word: Word) {
    try {
      if (playingId === word.id) {
        previewRequestId.current++
        player.pause()
        setPlayingId(null)
      }

      removeWord(word.id)
      const progress = Object.entries(data.progress)
        .filter(([id]) => currentWord(data, id)?.id === word.id)
        .map(([, item]) => item)
      const lifetimePracticeCount = progress.reduce((sum, item) => sum + item.sessionCount, 0)
      const lifetimePracticeDurationMs =
        progress.reduce((sum, item) => sum + item.totalTrainingSeconds, 0) * 1000

      track("word_removed", {
        word_id: word.id,
        word_name: word.label,
        lifetime_practice_count: lifetimePracticeCount,
        lifetime_practice_duration_ms: lifetimePracticeDurationMs,
      })
      setUserProperties({
        total_words_registered: words.filter((item) => item.sourceType === "recording").length - 1,
      })
    } catch {
      setError(t("words.removeError"))
    }
  }

  function confirmDelete(word: Word) {
    Alert.alert(t("words.confirmDelete", { word: word.label }), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteWord(word),
      },
    ])
  }

  function changeFilter(next: typeof filter) {
    track("word_library_filter_changed", {
      from: filter,
      to: next,
      visible_words_count:
        next === "all" ? words.length : words.filter((word) => word.tag === next).length,
    })
    setFilter(next)
  }

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Title style={styles.title}>{t("words.title")}</Title>
        <IconButton
          testID="word-add"
          icon="plus"
          label={t("words.add")}
          onPress={() => navigation.navigate("WordEditor")}
          style={styles.add}
          color="#3c2600"
        />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((item) => (
            <Chip
              key={item}
              testID={`word-filter-${item}`}
              label={t(`categories.${item}`)}
              selected={filter === item}
              onPress={() => changeFilter(item)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.error}>
        <InlineError message={error} />
      </View>

      <FlatList
        data={filteredWords}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Copy style={styles.parrot}>🦜</Copy>
            <Copy>{t("words.empty")}</Copy>
            <Copy style={styles.emptyHint}>{t("words.emptyHint")}</Copy>
          </View>
        }
        renderItem={({ item }) => {
          let initialColor = colors.orangeSoft

          if (item.tag === "name") {
            initialColor = colors.purpleSoft
          } else if (item.tag === "food") {
            initialColor = colors.blueSoft
          }

          const isPlaying = playingId === item.id && status.playing
          const previewLabel = t(isPlaying ? "words.stopPreview" : "words.preview", {
            word: item.label,
          })
          const sourceLabel = t(item.sourceType === "preset" ? "words.preset" : "words.recording")

          return (
            <View testID={`word-row-${item.id}`} style={[ui.card, styles.word]}>
              <View style={[styles.initial, { backgroundColor: initialColor }]}>
                <Copy style={styles.letter}>{Array.from(item.label)[0]}</Copy>
              </View>
              <View style={styles.description}>
                <View style={styles.wordTitle}>
                  <Copy style={styles.label}>{item.label}</Copy>
                  <Copy style={styles.tag}>{t(`categories.${item.tag}`)}</Copy>
                </View>
                <Copy style={styles.source}>{sourceLabel}</Copy>
              </View>
              {item.sourceType === "recording" ? (
                <IconButton
                  testID={`word-delete-${item.id}`}
                  icon="trash"
                  label={t("words.delete", { word: item.label })}
                  onPress={() => confirmDelete(item)}
                  color={colors.muted}
                />
              ) : null}
              <IconButton
                testID={`word-preview-${item.id}`}
                icon={isPlaying ? "stop" : "play"}
                label={previewLabel}
                onPress={() => void preview(item)}
                style={styles.preview}
                color="#3c2600"
              />
            </View>
          )
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  title: { flex: 1 },
  add: {
    backgroundColor: colors.orange,
    width: 50,
    height: 52,
    borderBottomWidth: 4,
    borderColor: colors.orangeDark,
  },
  filters: { paddingHorizontal: 22, paddingBottom: 10, gap: 8 },
  error: { paddingHorizontal: 22 },
  list: {
    padding: 22,
    paddingTop: 10,
    flexGrow: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  word: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  initial: {
    width: 48,
    height: 54,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: { fontSize: 27, fontFamily: font.black, color: colors.orangeText },
  description: { flex: 1, minWidth: 0 },
  wordTitle: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  label: { fontSize: 20, fontFamily: font.extraBold },
  tag: {
    color: colors.orangeText,
    backgroundColor: colors.orangeSoft,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 11,
  },
  source: { color: colors.muted, fontSize: 13, marginTop: 4 },
  preview: {
    backgroundColor: colors.orange,
    borderRadius: 26,
    borderBottomWidth: 3,
    borderColor: colors.orangeDark,
  },
  empty: { alignItems: "center", paddingTop: 45, gap: 10 },
  parrot: { fontSize: 44 },
  emptyHint: { color: colors.muted, textAlign: "center", lineHeight: 23 },
})
