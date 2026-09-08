import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SOURCES,
  TOPICS,
  fetchAllHeadlines,
  formatRelative,
  isHebrew,
  needsTranslation,
  sourceName,
  stripHtml,
  topicLabel,
  translateItems,
  type Headline,
  type HeadlinesPayload,
  type TopicId,
} from "./gesher";
import { useLocale } from "./locale";
import { openUrl } from "./open";
import { color, displayFamily, font, radius, sansFamily } from "./theme";
import { Colophon } from "./Colophon";

function splitFeed(items: Headline[]) {
  const withPhoto = items.filter((item) => item.imageUrl);
  const hero = withPhoto[0] ?? items[0];
  const used = new Set(hero ? [hero.id] : []);
  const top = items.filter((item) => !used.has(item.id)).slice(0, 5);
  top.forEach((item) => used.add(item.id));
  const popular = items.filter((item) => !used.has(item.id)).slice(0, 5);
  popular.forEach((item) => used.add(item.id));
  const rest = items.filter((item) => !used.has(item.id));
  return { hero, top, popular, rest };
}

export function NewsScreen() {
  const { locale, rtl, t } = useLocale();
  const [active, setActive] = useState<TopicId | "all">("all");
  const [payload, setPayload] = useState<HeadlinesPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);

  const load = useCallback(async () => {
    const next = await fetchAllHeadlines();
    setPayload(next);
    setTranslations({});
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!payload) return [];
    return active === "all" ? payload.headlines : payload.headlines.filter((item) => item.topic === active);
  }, [active, payload]);

  const { hero, top, popular, rest } = useMemo(() => splitFeed(filtered), [filtered]);

  const topicCounts = useMemo(() => {
    const counts = Object.fromEntries(TOPICS.map((topic) => [topic.id, 0])) as Record<TopicId, number>;
    if (!payload) return counts;
    for (const item of payload.headlines) counts[item.topic] += 1;
    return counts;
  }, [payload]);

  useEffect(() => {
    const items = filtered.flatMap((headline) => {
      const next = [];
      const titleKey = `${locale}:${headline.id}:title`;
      const summaryKey = `${locale}:${headline.id}:summary`;
      if (needsTranslation(headline.title, locale) && !translations[titleKey]) {
        next.push({ id: titleKey, text: headline.title });
      }
      if (headline.summary && needsTranslation(headline.summary, locale) && !translations[summaryKey]) {
        next.push({ id: summaryKey, text: headline.summary });
      }
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
  }, [filtered, locale, translations]);

  function translated(headline: Headline) {
    return {
      title: translations[`${locale}:${headline.id}:title`] ?? headline.title,
      summary: stripHtml(translations[`${locale}:${headline.id}:summary`] ?? headline.summary ?? "") || undefined,
    };
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  if (!payload) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={color.mint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={color.mint} />}
    >
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filters, rtl && styles.rowRtl]}>
          <Chip label={t("all")} active={active === "all"} onPress={() => setActive("all")} />
          {TOPICS.filter((topic) => topicCounts[topic.id] > 0).map((topic) => (
            <Chip
              key={topic.id}
              label={topicLabel(topic.id, locale)}
              active={active === topic.id}
              onPress={() => setActive(topic.id)}
            />
          ))}
        </ScrollView>
        <View style={[styles.actions, rtl && styles.rowRtl]}>
          {translating ? <Text style={styles.note}>{t("translating")}</Text> : null}
          <Pressable onPress={() => void refresh()} disabled={refreshing}>
            <Text style={styles.refresh}>{refreshing ? t("refreshing") : t("refresh")}</Text>
          </Pressable>
        </View>
      </View>

      {payload.errors.length > 0 ? (
        <Text style={[styles.note, styles.pad, rtl && styles.rtlText]}>
          {t("sourceFail")}{" "}
          {payload.errors
            .map((error) => {
              const source = SOURCES.find((item) => item.id === error.sourceId);
              return source ? sourceName(source, locale) : error.sourceId;
            })
            .join(", ")}
        </Text>
      ) : null}

      {hero ? (
        <HeroStory
          headline={hero}
          fetchedAt={payload.fetchedAt}
          title={translated(hero).title}
          summary={translated(hero).summary}
        />
      ) : null}

      {top.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, rtl && styles.rtlText]}>{t("topStories")}</Text>
          {top.map((headline, index) => (
            <NumberedRow
              key={headline.id}
              index={index + 1}
              headline={headline}
              fetchedAt={payload.fetchedAt}
              title={translated(headline).title}
            />
          ))}
        </View>
      ) : null}

      {active === "all" && popular.length > 0 ? (
        <View style={styles.popularCard}>
          <Text style={[styles.cardKicker, rtl && styles.rtlText]}>{t("mostPopular")}</Text>
          {popular.map((headline, index) => (
            <NumberedRow
              key={headline.id}
              index={index + 1}
              headline={headline}
              fetchedAt={payload.fetchedAt}
              title={translated(headline).title}
              onColor
            />
          ))}
        </View>
      ) : null}

      {rest.map((headline) => {
        const copy = translated(headline);
        return (
          <StreamCard
            key={headline.id}
            headline={headline}
            fetchedAt={payload.fetchedAt}
            title={copy.title}
            summary={copy.summary}
          />
        );
      })}

      {filtered.length === 0 ? <Text style={[styles.note, styles.pad, rtl && styles.rtlText]}>{t("empty")}</Text> : null}
      <Colophon kind="news" />
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipOnText]}>{label}</Text>
    </Pressable>
  );
}

function Meta({
  headline,
  fetchedAt,
  onColor,
}: {
  headline: Headline;
  fetchedAt: string;
  onColor?: boolean;
}) {
  const { locale, rtl } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  if (!source) return null;
  return (
    <View style={[styles.meta, rtl && styles.rowRtl]}>
      <Text style={[styles.byline, onColor && styles.onColorMeta]}>{sourceName(source, locale)}</Text>
      <Text style={[styles.topic, onColor && styles.onColorMuted]}>{topicLabel(headline.topic, locale)}</Text>
      {headline.publishedAt ? (
        <Text style={[styles.time, onColor && styles.onColorMuted]}>
          {formatRelative(headline.publishedAt, locale, Date.parse(fetchedAt))}
        </Text>
      ) : null}
    </View>
  );
}

function HeroStory({
  headline,
  fetchedAt,
  title,
  summary,
}: {
  headline: Headline;
  fetchedAt: string;
  title: string;
  summary?: string;
}) {
  const { locale, rtl, t } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  const [photo, setPhoto] = useState(Boolean(headline.imageUrl));
  const align = isHebrew(title) || rtl ? "right" : "left";

  useEffect(() => {
    setPhoto(Boolean(headline.imageUrl));
  }, [headline.imageUrl]);

  if (!source) return null;
  const publisher = sourceName(source, locale);

  return (
    <Pressable style={styles.hero} onPress={() => void openUrl(headline.url)}>
      {photo && headline.imageUrl ? (
        <Image source={{ uri: headline.imageUrl }} style={styles.heroPhoto} onError={() => setPhoto(false)} />
      ) : (
        <View style={[styles.heroPhoto, styles.heroFallback]} />
      )}
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.88)"]} style={styles.heroShade} />
      <View style={styles.heroCopy}>
        <Meta headline={headline} fetchedAt={fetchedAt} onColor />
        <Text style={[styles.heroTitle, { fontFamily: displayFamily(title), textAlign: align }]} numberOfLines={4}>
          {title}
        </Text>
        {summary ? (
          <Text style={[styles.heroDek, { textAlign: align }]} numberOfLines={2}>
            {summary}
          </Text>
        ) : null}
        <Text style={styles.heroLink}>
          {t("readOn")} {publisher}
        </Text>
      </View>
    </Pressable>
  );
}

function NumberedRow({
  index,
  headline,
  fetchedAt,
  title,
  onColor,
}: {
  index: number;
  headline: Headline;
  fetchedAt: string;
  title: string;
  onColor?: boolean;
}) {
  const { locale, rtl, t } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  const [photo, setPhoto] = useState(Boolean(headline.imageUrl));
  const align = isHebrew(title) || rtl ? "right" : "left";

  useEffect(() => {
    setPhoto(Boolean(headline.imageUrl));
  }, [headline.imageUrl]);

  if (!source) return null;

  return (
    <Pressable
      onPress={() => void openUrl(headline.url)}
      style={[styles.row, rtl && styles.rowRtl, onColor && styles.rowOnColor]}
    >
      <Text style={styles.rank}>{String(index).padStart(2, "0")}</Text>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { fontFamily: sansFamily(title, "bold"), textAlign: align }]} numberOfLines={3}>
          {title}
        </Text>
        <Meta headline={headline} fetchedAt={fetchedAt} onColor={onColor} />
        <Text style={[styles.rowLink, onColor && styles.onColorMuted]}>
          {t("readOn")} {sourceName(source, locale)}
        </Text>
      </View>
      {photo && headline.imageUrl ? (
        <Image source={{ uri: headline.imageUrl }} style={styles.thumb} onError={() => setPhoto(false)} />
      ) : (
        <View style={styles.thumb} />
      )}
    </Pressable>
  );
}

function StreamCard({
  headline,
  fetchedAt,
  title,
  summary,
}: {
  headline: Headline;
  fetchedAt: string;
  title: string;
  summary?: string;
}) {
  const { locale, rtl, t } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  const [photo, setPhoto] = useState(Boolean(headline.imageUrl));
  const align = isHebrew(title) || rtl ? "right" : "left";

  useEffect(() => {
    setPhoto(Boolean(headline.imageUrl));
  }, [headline.imageUrl]);

  if (!source) return null;

  return (
    <Pressable onPress={() => void openUrl(headline.url)} style={[styles.stream, rtl && styles.rowRtl]}>
      <View style={styles.streamCopy}>
        <Meta headline={headline} fetchedAt={fetchedAt} />
        <Text style={[styles.streamTitle, { fontFamily: sansFamily(title, "bold"), textAlign: align }]}>{title}</Text>
        {summary ? (
          <Text style={[styles.streamDek, { textAlign: align }]} numberOfLines={3}>
            {summary}
          </Text>
        ) : null}
        <Text style={styles.rowLink}>
          {t("readOn")} {sourceName(source, locale)}
        </Text>
      </View>
      {photo && headline.imageUrl ? (
        <Image source={{ uri: headline.imageUrl }} style={styles.streamThumb} onError={() => setPhoto(false)} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: color.charcoal,
  },
  content: {
    paddingBottom: 32,
    gap: 8,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.charcoal,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 12,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  rtlText: {
    textAlign: "right",
  },
  chip: {
    borderWidth: 1,
    borderColor: color.mist,
    borderRadius: radius.button,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: color.charcoal,
  },
  chipOn: {
    backgroundColor: color.mint,
    borderColor: color.mint,
  },
  chipText: {
    color: color.paper,
    fontFamily: font.monoBold,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  chipOnText: {
    color: color.onyx,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refresh: {
    color: color.mint,
    fontFamily: font.monoBold,
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
    marginBottom: 8,
  },
  block: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 0,
  },
  sectionLabel: {
    color: color.mint,
    fontFamily: font.sansMedium,
    fontSize: 20,
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  popularCard: {
    marginHorizontal: 16,
    marginTop: 28,
    backgroundColor: color.ultraviolet,
    borderRadius: radius.card,
    padding: 20,
  },
  cardKicker: {
    color: color.paper,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: color.iron,
    minHeight: 320,
    justifyContent: "flex-end",
  },
  heroPhoto: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    backgroundColor: color.iron,
  },
  heroShade: {
    ...StyleSheet.absoluteFill,
  },
  heroCopy: {
    padding: 20,
    gap: 8,
  },
  heroTitle: {
    color: color.paper,
    fontSize: 40,
    lineHeight: 36,
    letterSpacing: 0.4,
  },
  heroDek: {
    color: color.fog,
    fontFamily: font.serif,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.16,
  },
  heroLink: {
    color: color.mint,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  byline: {
    color: color.mint,
    fontFamily: font.sansMedium,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  topic: {
    color: color.fog,
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  time: {
    color: color.fog,
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  onColorMeta: {
    color: color.mint,
  },
  onColorMuted: {
    color: "rgba(255,255,255,0.72)",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: color.iron,
  },
  rowOnColor: {
    borderTopColor: "rgba(255,255,255,0.18)",
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
    gap: 6,
  },
  rowTitle: {
    color: color.paper,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: 0.36,
  },
  rowLink: {
    color: color.fog,
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radius.image,
    backgroundColor: color.iron,
  },
  stream: {
    marginHorizontal: 16,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: color.iron,
  },
  streamCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  streamTitle: {
    color: color.paper,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.4,
  },
  streamDek: {
    color: color.fog,
    fontFamily: font.serif,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.16,
  },
  streamThumb: {
    width: 92,
    height: 92,
    borderRadius: radius.image,
    backgroundColor: color.iron,
  },
});
