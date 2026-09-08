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
import { color, displayFamily, font, radius, sansFamily } from "./theme";
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
        <ActivityIndicator color={color.mint} />
      </View>
    );
  }

  const current = payload.episodes.find((episode) => episode.id === currentEpisode?.id) ?? payload.episodes[0];
  const opened = payload.episodes.find((episode) => episode.id === openId) ?? null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.pageHead}>
        <Text style={[styles.kicker, rtl && styles.rtlText]}>{t("navPodcasts")}</Text>
        <Text style={[styles.h1, rtl && styles.rtlText, { fontFamily: displayFamily(t("navPodcasts")) }]}>
          {t("navPodcasts")}
        </Text>
        <Text style={[styles.lead, rtl && styles.rtlText]}>{t("podcastsLead")}</Text>
      </View>

      {current ? (
        <View style={[styles.now, rtl && styles.rowRtl]}>
          {current.imageUrl ? <Image source={{ uri: current.imageUrl }} style={styles.art} /> : <View style={styles.art} />}
          <View style={styles.nowCopy}>
            <Text style={styles.nowLabel}>{t("nowPlaying")}</Text>
            <Text
              style={[
                styles.nowTitle,
                {
                  fontFamily: sansFamily(copy(current).title, "bold"),
                  textAlign: isHebrew(copy(current).title) || rtl ? "right" : "left",
                },
              ]}
            >
              {copy(current).title}
            </Text>
            <Text style={[styles.nowMeta, rtl && styles.rtlText]}>{podcastName(PODCAST_BY_ID[current.showId], locale)}</Text>
          </View>
          <Pressable
            onPress={() => toggleEpisode(current)}
            style={[styles.listen, currentEpisode?.id === current.id && podcastPlaying && styles.listenGhost]}
          >
            <Text style={[styles.listenText, currentEpisode?.id === current.id && podcastPlaying && styles.listenGhostText]}>
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

      <View style={styles.heatCard}>
        <Text style={[styles.cardKicker, rtl && styles.rtlText]}>{t("navPodcasts")}</Text>
        {payload.episodes.map((episode, index) => {
          const show = PODCAST_BY_ID[episode.showId];
          const text = copy(episode);
          const selected = episode.id === currentEpisode?.id;
          const align = isHebrew(text.title) || rtl ? "right" : "left";
          return (
            <View key={episode.id} style={[styles.row, rtl && styles.rowRtl, selected && podcastPlaying && styles.rowLive]}>
              <Text style={styles.rank}>{String(index + 1).padStart(2, "0")}</Text>
              <Pressable style={styles.rowCopy} onPress={() => setOpenId(episode.id)}>
                <Text
                  style={[styles.rowTitle, { fontFamily: sansFamily(text.title, "bold"), textAlign: align }]}
                  numberOfLines={3}
                >
                  {text.title}
                </Text>
                <Text style={styles.byline}>{podcastName(show, locale)}</Text>
                {episode.publishedAt ? (
                  <Text style={styles.time}>{formatRelative(episode.publishedAt, locale, Date.parse(payload.fetchedAt))}</Text>
                ) : null}
                <Text style={styles.hint}>{t("lessonsHint")}</Text>
              </Pressable>
              {episode.imageUrl ? <Image source={{ uri: episode.imageUrl }} style={styles.thumb} /> : <View style={styles.thumb} />}
            </View>
          );
        })}
      </View>

      {payload.episodes.length === 0 ? (
        <Text style={[styles.note, styles.pad, rtl && styles.rtlText]}>{t("podcastEmpty")}</Text>
      ) : null}

      <Colophon kind="podcasts" />

      <Modal visible={Boolean(opened)} transparent animationType="fade" onRequestClose={() => setOpenId(null)}>
        <Pressable style={styles.layer} onPress={() => setOpenId(null)}>
          {opened ? (
            <Pressable style={styles.inset} onPress={(event) => event.stopPropagation()}>
              <View style={[styles.insetHead, rtl && styles.rowRtl]}>
                <Text style={styles.byline}>{podcastName(PODCAST_BY_ID[opened.showId], locale)}</Text>
                <Pressable onPress={() => setOpenId(null)}>
                  <Text style={styles.close}>{t("close")}</Text>
                </Pressable>
              </View>
              <Text
                style={[
                  styles.insetTitle,
                  {
                    fontFamily: displayFamily(copy(opened).title),
                    textAlign: isHebrew(copy(opened).title) || rtl ? "right" : "left",
                  },
                ]}
              >
                {copy(opened).title}
              </Text>
              <Text style={[styles.lessonKicker, rtl && styles.rtlText]}>{t("lessons")}</Text>
              {copy(opened).lessons.length > 0 ? (
                copy(opened).lessons.map((lesson) => (
                  <Text key={lesson} style={[styles.lesson, { textAlign: isHebrew(lesson) || rtl ? "right" : "left" }]}>
                    {lesson}
                  </Text>
                ))
              ) : (
                <Text style={[styles.lesson, rtl && styles.rtlText]}>{t("lessonsEmpty")}</Text>
              )}
              <View style={[styles.insetActions, rtl && styles.rowRtl]}>
                <Pressable
                  onPress={() => toggleEpisode(opened)}
                  style={[styles.listen, currentEpisode?.id === opened.id && podcastPlaying && styles.listenGhost]}
                >
                  <Text
                    style={[
                      styles.listenText,
                      currentEpisode?.id === opened.id && podcastPlaying && styles.listenGhostText,
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
    backgroundColor: color.charcoal,
  },
  content: {
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.charcoal,
  },
  pageHead: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 8,
  },
  kicker: {
    color: color.mint,
    fontFamily: font.sansMedium,
    fontSize: 20,
    letterSpacing: 0.4,
  },
  h1: {
    color: color.paper,
    fontSize: 56,
    lineHeight: 48,
    letterSpacing: 0.56,
  },
  lead: {
    color: color.fog,
    fontFamily: font.serif,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.16,
  },
  rtlText: {
    textAlign: "right",
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  now: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: radius.card,
    backgroundColor: color.graphite,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  art: {
    width: 60,
    height: 60,
    borderRadius: radius.image,
    backgroundColor: color.iron,
  },
  nowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nowLabel: {
    color: color.mint,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  nowTitle: {
    color: color.paper,
    fontSize: 16,
    letterSpacing: 0.32,
  },
  nowMeta: {
    color: color.fog,
    fontFamily: font.sansMedium,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  note: {
    color: color.fog,
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  pad: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  heatCard: {
    marginHorizontal: 16,
    backgroundColor: color.heat,
    borderRadius: radius.card,
    padding: 20,
  },
  cardKicker: {
    color: color.paper,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
  },
  rowLive: {
    borderTopColor: color.mint,
  },
  rank: {
    color: color.mint,
    fontFamily: font.sansBold,
    fontSize: 16,
    width: 28,
    paddingTop: 2,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowTitle: {
    color: color.paper,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: 0.36,
  },
  byline: {
    color: color.mint,
    fontFamily: font.sansMedium,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  time: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  hint: {
    color: color.paper,
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    textDecorationLine: "underline",
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radius.image,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  listen: {
    backgroundColor: color.mint,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "center",
  },
  listenGhost: {
    backgroundColor: color.onyx,
  },
  listenText: {
    color: color.onyx,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  listenGhostText: {
    color: color.mint,
  },
  layer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 80,
  },
  inset: {
    backgroundColor: color.graphite,
    borderRadius: radius.card,
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
    color: color.mint,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  insetTitle: {
    color: color.paper,
    fontSize: 34,
    lineHeight: 32,
    letterSpacing: 0.34,
  },
  lessonKicker: {
    marginTop: 18,
    marginBottom: 8,
    color: color.mint,
    fontFamily: font.sansMedium,
    fontSize: 20,
    letterSpacing: 0.4,
  },
  lesson: {
    color: color.fog,
    fontFamily: font.serif,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.16,
    marginBottom: 12,
  },
  insetActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14,
    marginTop: 8,
  },
  outbound: {
    color: color.paper,
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    textDecorationLine: "underline",
  },
});
