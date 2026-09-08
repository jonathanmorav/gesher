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
import { color, font } from "./theme";
import { Colophon } from "./Colophon";

function takeHero(items: Headline[]): { hero: Headline[]; rest: Headline[] } {
  const withPhoto = items.filter((item) => item.imageUrl);
  const without = items.filter((item) => !item.imageUrl);
  const picks = [...withPhoto, ...without].slice(0, Math.min(4, items.length));
  const used = new Set(picks.map((item) => item.id));
  return { hero: picks, rest: items.filter((item) => !used.has(item.id)) };
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

  const { hero, rest } = useMemo(() => takeHero(filtered), [filtered]);

  const sections = useMemo(() => {
    if (active !== "all") return [];
    return TOPICS.map((topic) => ({
      topic: topic.id,
      items: rest.filter((item) => item.topic === topic.id),
    })).filter((section) => section.items.length > 0);
  }, [active, rest]);

  const leftover = active === "all" ? [] : rest;

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
        <ActivityIndicator color={color.red} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={color.red} />}
    >
      <View style={[styles.toolbar, rtl && styles.toolbarRtl]}>
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

      {hero.map((headline, index) => {
        const copy = translated(headline);
        return (
          <StoryTile
            key={headline.id}
            headline={headline}
            cover={index === 0}
            fetchedAt={payload.fetchedAt}
            title={copy.title}
            summary={copy.summary}
          />
        );
      })}

      {sections.map((section) => (
        <View key={section.topic} style={styles.block}>
          <Text style={[styles.heading, rtl && styles.rtlText]}>{topicLabel(section.topic, locale)}</Text>
          {section.items.map((headline) => {
            const copy = translated(headline);
            return (
              <StoryTile
                key={headline.id}
                headline={headline}
                cover={false}
                fetchedAt={payload.fetchedAt}
                title={copy.title}
                summary={copy.summary}
              />
            );
          })}
        </View>
      ))}

      {leftover.map((headline) => {
        const copy = translated(headline);
        return (
          <StoryTile
            key={headline.id}
            headline={headline}
            cover={false}
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

function StoryTile({
  headline,
  cover,
  fetchedAt,
  title,
  summary,
}: {
  headline: Headline;
  cover: boolean;
  fetchedAt: string;
  title: string;
  summary?: string;
}) {
  const { locale, rtl, t } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  const [photo, setPhoto] = useState(Boolean(headline.imageUrl));

  useEffect(() => {
    setPhoto(Boolean(headline.imageUrl));
  }, [headline.imageUrl]);

  if (!source) return null;

  const publisher = sourceName(source, locale);
  const titleAlign = isHebrew(title) || rtl ? "right" : "left";

  return (
    <View style={styles.tile}>
      {photo && headline.imageUrl ? (
        <Image
          source={{ uri: headline.imageUrl }}
          style={[styles.photo, cover && styles.coverPhoto]}
          onError={() => setPhoto(false)}
        />
      ) : null}
      <View style={styles.copy}>
        <View style={[styles.meta, rtl && styles.rowRtl]}>
          <Text style={styles.source}>{publisher}</Text>
          <Text style={styles.topic}>{topicLabel(headline.topic, locale)}</Text>
          {headline.publishedAt ? (
            <Text style={styles.time}>{formatRelative(headline.publishedAt, locale, Date.parse(fetchedAt))}</Text>
          ) : null}
        </View>
        <Text style={[styles.title, cover && styles.coverTitle, { textAlign: titleAlign }]}>{title}</Text>
        {summary ? <Text style={[styles.dek, { textAlign: titleAlign }]}>{summary}</Text> : null}
        <Pressable onPress={() => void openUrl(headline.url)}>
          <Text style={[styles.outbound, rtl && styles.rtlText]}>
            {t("readOn")} {publisher}
          </Text>
        </Pressable>
      </View>
    </View>
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
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  toolbarRtl: {
    alignItems: "stretch",
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
    borderColor: color.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipOn: {
    backgroundColor: color.ink,
    borderColor: color.ink,
  },
  chipText: {
    color: color.inkSoft,
    fontFamily: font.sans,
    fontSize: 14,
  },
  chipOnText: {
    color: "#fff",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refresh: {
    color: color.mute,
    fontFamily: font.sans,
    fontSize: 14,
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
  block: {
    gap: 12,
    marginTop: 12,
  },
  heading: {
    marginHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    fontFamily: font.sansBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: color.ink,
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
  photo: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: color.photoBg,
  },
  coverPhoto: {
    aspectRatio: 16 / 10,
  },
  copy: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
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
  topic: {
    color: color.inkSoft,
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
  coverTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  dek: {
    marginTop: 10,
    color: color.inkSoft,
    fontFamily: font.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  outbound: {
    marginTop: 12,
    color: color.inkSoft,
    fontFamily: font.sans,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
