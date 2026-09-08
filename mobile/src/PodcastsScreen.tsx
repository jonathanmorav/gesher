import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  PODCASTS,
  PODCAST_BY_ID,
  fetchAllEpisodes,
  formatRelative,
  isHebrew,
  needsTranslation,
  podcastName,
  stripHtml,
  translateItems,
  type Episode,
  type EpisodesPayload,
} from "./gesher";
import { useAudioHub } from "./audio";
import { useLocale } from "./locale";
import { openUrl } from "./open";
import { color, font } from "./theme";
import { Colophon } from "./Colophon";

export function PodcastsScreen() {
  const { locale, rtl, t } = useLocale();
  const { currentEpisode, podcastPlaying, toggleEpisode } = useAudioHub();
  const [payload, setPayload] = useState<EpisodesPayload | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void fetchAllEpisodes().then(setPayload);
  }, []);

  useEffect(() => {
    if (!payload) return;
    const items = payload.episodes.flatMap((episode) => {
      const next = [];
      const titleKey = `${locale}:${episode.id}:title`;
      if (needsTranslation(episode.title, locale) && !translations[titleKey]) {
        next.push({ id: titleKey, text: episode.title });
      }
      episode.lessons.forEach((lesson, index) => {
        const lessonKey = `${locale}:${episode.id}:lesson:${index}`;
        if (needsTranslation(lesson, locale) && !translations[lessonKey]) {
          next.push({ id: lessonKey, text: lesson });
        }
      });
      return next;
    });
    if (items.length === 0) return;

    let cancelled = false;
    setTranslating(true);
    void translateItems(items, locale)
      .then((data) => {
        if (!cancelled) setTranslations((current) => ({ ...current, ...data }));
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, payload, translations]);

  function copy(episode: Episode) {
    return {
      title: translations[`${locale}:${episode.id}:title`] ?? episode.title,
      lessons: episode.lessons
        .map((lesson, index) => stripHtml(translations[`${locale}:${episode.id}:lesson:${index}`] ?? lesson))
        .filter(Boolean),
    };
  }

  if (!payload) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={color.red} />
      </View>
    );
  }

  const current = payload.episodes.find((episode) => episode.id === currentEpisode?.id) ?? payload.episodes[0];
  const opened = payload.episodes.find((episode) => episode.id === openId) ?? null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.pageHead}>
        <Text style={[styles.h1, rtl && styles.rtlText]}>{t("navPodcasts")}</Text>
        <Text style={[styles.lead, rtl && styles.rtlText]}>{t("podcastsLead")}</Text>
      </View>

      {current ? (
        <View style={[styles.now, rtl && styles.rowRtl]}>
          {current.imageUrl ? <Image source={{ uri: current.imageUrl }} style={styles.art} /> : <View style={styles.art} />}
          <View style={styles.nowCopy}>
            <Text style={[styles.nowTitle, { textAlign: isHebrew(copy(current).title) || rtl ? "right" : "left" }]}>
              {copy(current).title}
            </Text>
            <Text style={[styles.nowMeta, rtl && styles.rtlText]}>
              {t("nowPlaying")} · {podcastName(PODCAST_BY_ID[current.showId], locale)}
            </Text>
          </View>
          <Pressable
            onPress={() => toggleEpisode(current)}
            style={[styles.playEp, currentEpisode?.id === current.id && podcastPlaying && styles.playGhost]}
          >
            <Text style={[styles.playEpText, currentEpisode?.id === current.id && podcastPlaying && styles.playGhostText]}>
              {currentEpisode?.id === current.id && podcastPlaying ? t("pause") : t("listen")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {translating ? <Text style={[styles.note, styles.pad, rtl && styles.rtlText]}>{t("translating")}</Text> : null}

      {payload.errors.length > 0 ? (
        <Text style={[styles.note, styles.pad, rtl && styles.rtlText]}>
          {t("sourceFail")}{" "}
          {payload.errors
            .map((error) => {
              const show = PODCASTS.find((item) => item.id === error.showId);
              return show ? podcastName(show, locale) : error.showId;
            })
            .join(", ")}
        </Text>
      ) : null}

      {payload.episodes.map((episode) => {
        const show = PODCAST_BY_ID[episode.showId];
        const text = copy(episode);
        const selected = episode.id === currentEpisode?.id;
        return (
          <View key={episode.id} style={[styles.tile, selected && podcastPlaying && styles.tilePlaying]}>
            <Pressable onPress={() => setOpenId(episode.id)}>
              {episode.imageUrl ? <Image source={{ uri: episode.imageUrl }} style={styles.photo} /> : null}
              <View style={styles.copy}>
                <View style={[styles.meta, rtl && styles.rowRtl]}>
                  <Text style={styles.source}>{podcastName(show, locale)}</Text>
                  {episode.publishedAt ? (
                    <Text style={styles.time}>{formatRelative(episode.publishedAt, locale, Date.parse(payload.fetchedAt))}</Text>
                  ) : null}
                </View>
                <Text style={[styles.title, { textAlign: isHebrew(text.title) || rtl ? "right" : "left" }]}>{text.title}</Text>
                <Text style={[styles.hint, rtl && styles.rtlText]}>{t("lessonsHint")}</Text>
              </View>
            </Pressable>
            <View style={[styles.actions, rtl && styles.rowRtl]}>
              <Pressable
                onPress={() => toggleEpisode(episode)}
                style={[styles.playEp, selected && podcastPlaying && styles.playGhost]}
              >
                <Text style={[styles.playEpText, selected && podcastPlaying && styles.playGhostText]}>
                  {selected && podcastPlaying ? t("pause") : t("listen")}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {payload.episodes.length === 0 ? (
        <Text style={[styles.note, styles.pad, rtl && styles.rtlText]}>{t("podcastEmpty")}</Text>
      ) : null}

      <Colophon kind="podcasts" />

      <Modal visible={Boolean(opened)} transparent animationType="fade" onRequestClose={() => setOpenId(null)}>
        <Pressable style={styles.layer} onPress={() => setOpenId(null)}>
          {opened ? (
            <Pressable style={styles.inset} onPress={(event) => event.stopPropagation()}>
              <View style={[styles.insetHead, rtl && styles.rowRtl]}>
                <Text style={styles.source}>{podcastName(PODCAST_BY_ID[opened.showId], locale)}</Text>
                <Pressable onPress={() => setOpenId(null)}>
                  <Text style={styles.close}>{t("close")}</Text>
                </Pressable>
              </View>
              <Text style={[styles.insetTitle, { textAlign: isHebrew(copy(opened).title) || rtl ? "right" : "left" }]}>
                {copy(opened).title}
              </Text>
              <Text style={[styles.kicker, rtl && styles.rtlText]}>{t("lessons")}</Text>
              {copy(opened).lessons.length > 0 ? (
                copy(opened).lessons.map((lesson) => (
                  <Text key={lesson} style={[styles.lesson, { textAlign: isHebrew(lesson) || rtl ? "right" : "left" }]}>
                    {lesson}
                  </Text>
                ))
              ) : (
                <Text style={[styles.lesson, rtl && styles.rtlText]}>{t("lessonsEmpty")}</Text>
              )}
              <View style={[styles.actions, rtl && styles.rowRtl]}>
                <Pressable
                  onPress={() => toggleEpisode(opened)}
                  style={[styles.playEp, currentEpisode?.id === opened.id && podcastPlaying && styles.playGhost]}
                >
                  <Text
                    style={[
                      styles.playEpText,
                      currentEpisode?.id === opened.id && podcastPlaying && styles.playGhostText,
                    ]}
                  >
                    {currentEpisode?.id === opened.id && podcastPlaying ? t("pause") : t("listen")}
                  </Text>
                </Pressable>
                <Pressable onPress={() => void openUrl(opened.url)}>
                  <Text style={styles.outbound}>
                    {t("readOn")} {podcastName(PODCAST_BY_ID[opened.showId], locale)}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: color.board,
  },
  content: {
    paddingBottom: 24,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.board,
  },
  pageHead: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  h1: {
    fontFamily: font.sansBlack,
    fontSize: 28,
    color: color.ink,
  },
  lead: {
    marginTop: 8,
    color: color.inkSoft,
    fontFamily: font.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  rtlText: {
    textAlign: "right",
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  now: {
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  art: {
    width: 56,
    height: 56,
    backgroundColor: color.photoBg,
  },
  nowCopy: {
    flex: 1,
    minWidth: 0,
  },
  nowTitle: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: color.ink,
  },
  nowMeta: {
    marginTop: 4,
    color: color.mute,
    fontFamily: font.sans,
    fontSize: 12,
  },
  note: {
    color: color.mute,
    fontFamily: font.sans,
    fontSize: 13,
  },
  pad: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tile: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  tilePlaying: {
    borderColor: color.red,
  },
  photo: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: color.photoBg,
  },
  copy: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  source: {
    color: color.red,
    fontFamily: font.sansBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  time: {
    color: color.mute,
    fontFamily: font.sans,
    fontSize: 12,
  },
  title: {
    color: color.ink,
    fontFamily: font.sansBlack,
    fontSize: 20,
    lineHeight: 26,
  },
  hint: {
    marginTop: 10,
    color: color.mute,
    fontFamily: font.sans,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  playEp: {
    backgroundColor: color.ink,
    borderWidth: 1,
    borderColor: color.ink,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  playGhost: {
    backgroundColor: "#fff",
  },
  playEpText: {
    color: "#fff",
    fontFamily: font.sans,
    fontSize: 13,
  },
  playGhostText: {
    color: color.ink,
  },
  layer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.72)",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 80,
  },
  inset: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 4,
    padding: 22,
    maxHeight: "100%",
  },
  insetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  close: {
    color: color.inkSoft,
    fontFamily: font.sans,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  insetTitle: {
    fontFamily: font.sansBlack,
    fontSize: 24,
    color: color.ink,
    lineHeight: 30,
  },
  kicker: {
    marginTop: 18,
    marginBottom: 8,
    color: color.red,
    fontFamily: font.sansBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  lesson: {
    color: color.inkSoft,
    fontFamily: font.sans,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  outbound: {
    color: color.inkSoft,
    fontFamily: font.sans,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
