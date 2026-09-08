import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { formatIsraelClock } from "./gesher";
import { useLocale } from "./locale";
import { color, font } from "./theme";

export type ScreenId = "news" | "podcasts";

export function Masthead({ screen, onScreen }: { screen: ScreenId; onScreen: (screen: ScreenId) => void }) {
  const { locale, rtl, setLocale, t } = useLocale();
  const insets = useSafeAreaInsets();
  const [clock, setClock] = useState(() => formatIsraelClock(new Date(), locale));

  useEffect(() => {
    const tick = () => setClock(formatIsraelClock(new Date(), locale));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locale]);

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={[styles.inner, rtl && styles.innerRtl]}>
        <View style={[styles.brand, rtl && styles.rowRtl]}>
          <View style={styles.mark}>
            <Text style={styles.markLetter}>ג</Text>
          </View>
          <View>
            <Text style={styles.wordmark}>גשר</Text>
            <Text style={styles.tag} numberOfLines={1}>
              {t("tagline")}
            </Text>
          </View>
        </View>

        <View style={[styles.nav, rtl && styles.rowRtl]}>
          <Pressable onPress={() => onScreen("news")} hitSlop={8}>
            <Text style={[styles.navLink, screen === "news" && styles.navActive]}>{t("navHeadlines")}</Text>
          </Pressable>
          <Pressable onPress={() => onScreen("podcasts")} hitSlop={8}>
            <Text style={[styles.navLink, screen === "podcasts" && styles.navActive]}>{t("navPodcasts")}</Text>
          </Pressable>
        </View>

        <View style={[styles.tools, rtl && styles.rowRtl]}>
          <View style={[styles.lang, rtl && styles.rowRtl]}>
            <Pressable onPress={() => setLocale("he")} style={[styles.langBtn, locale === "he" && styles.langOn]}>
              <Text style={[styles.langText, locale === "he" && styles.langOnText]}>עב</Text>
            </Pressable>
            <Pressable onPress={() => setLocale("en")} style={[styles.langBtn, locale === "en" && styles.langOn]}>
              <Text style={[styles.langText, locale === "en" && styles.langOnText]}>EN</Text>
            </Pressable>
          </View>
          <View style={styles.clock}>
            <Text style={styles.clockTime}>{clock.time}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: color.board,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  inner: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  innerRtl: {
    alignItems: "stretch",
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: color.red,
    alignItems: "center",
    justifyContent: "center",
  },
  markLetter: {
    color: "#fff",
    fontFamily: font.sansBlack,
    fontSize: 22,
    lineHeight: 28,
  },
  wordmark: {
    fontFamily: font.sansBlack,
    fontSize: 22,
    letterSpacing: -0.4,
    color: color.ink,
    lineHeight: 24,
  },
  tag: {
    marginTop: 3,
    color: color.mute,
    fontFamily: font.sans,
    fontSize: 12,
    maxWidth: 260,
  },
  nav: {
    flexDirection: "row",
    gap: 18,
  },
  navLink: {
    color: color.mute,
    fontFamily: font.sans,
    fontSize: 14,
    paddingBottom: 4,
  },
  navActive: {
    color: color.ink,
    borderBottomWidth: 2,
    borderBottomColor: color.red,
  },
  tools: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  lang: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 999,
    overflow: "hidden",
  },
  langBtn: {
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  langOn: {
    backgroundColor: color.red,
  },
  langText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: color.inkSoft,
    letterSpacing: 0.4,
  },
  langOnText: {
    color: "#fff",
  },
  clock: {
    alignItems: "flex-end",
  },
  clockTime: {
    fontFamily: font.mono,
    fontSize: 16,
    color: color.ink,
  },
});
