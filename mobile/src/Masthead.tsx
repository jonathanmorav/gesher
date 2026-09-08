import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { formatIsraelClock } from "./gesher";
import { useLocale } from "./locale";
import { color, font, radius } from "./theme";

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
      <View style={[styles.brandRow, rtl && styles.rowRtl]}>
        <View style={styles.brandCopy}>
          <Text style={[styles.wordmark, rtl && styles.rtlText]}>גשר</Text>
          <Text style={[styles.tag, rtl && styles.rtlText]} numberOfLines={2}>
            {t("tagline")}
          </Text>
        </View>
        <Text style={styles.clock}>{clock.time}</Text>
      </View>

      <View style={[styles.tools, rtl && styles.rowRtl]}>
        <View style={[styles.nav, rtl && styles.rowRtl]}>
          <Pressable onPress={() => onScreen("news")} hitSlop={8} style={[styles.navItem, screen === "news" && styles.navOn]}>
            <Text style={[styles.navLink, screen === "news" && styles.navLinkOn]}>{t("navHeadlines")}</Text>
          </Pressable>
          <Pressable
            onPress={() => onScreen("podcasts")}
            hitSlop={8}
            style={[styles.navItem, screen === "podcasts" && styles.navOn]}
          >
            <Text style={[styles.navLink, screen === "podcasts" && styles.navLinkOn]}>{t("navPodcasts")}</Text>
          </Pressable>
        </View>

        <View style={[styles.lang, rtl && styles.rowRtl]}>
          <Pressable onPress={() => setLocale("he")} style={[styles.langBtn, locale === "he" && styles.langOn]}>
            <Text style={[styles.langText, locale === "he" && styles.langOnText]}>עב</Text>
          </Pressable>
          <Pressable onPress={() => setLocale("en")} style={[styles.langBtn, locale === "en" && styles.langOn]}>
            <Text style={[styles.langText, locale === "en" && styles.langOnText]}>EN</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: color.charcoal,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  rtlText: {
    textAlign: "right",
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  wordmark: {
    fontFamily: font.displayHe,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: 0.68,
    color: color.paper,
  },
  tag: {
    marginTop: 4,
    color: color.fog,
    fontFamily: font.sans,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  clock: {
    fontFamily: font.monoMed,
    fontSize: 12,
    letterSpacing: 1.5,
    color: color.silver,
  },
  tools: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  nav: {
    flexDirection: "row",
    gap: 18,
    flex: 1,
  },
  navItem: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  navOn: {
    borderTopColor: color.mint,
  },
  navLink: {
    color: color.paper,
    fontFamily: font.sans,
    fontSize: 16,
    letterSpacing: 0.32,
  },
  navLinkOn: {
    color: color.mint,
  },
  lang: {
    flexDirection: "row",
    gap: 6,
  },
  langBtn: {
    borderWidth: 1,
    borderColor: color.mist,
    borderRadius: radius.button,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: color.charcoal,
  },
  langOn: {
    backgroundColor: color.mint,
    borderColor: color.mint,
  },
  langText: {
    fontFamily: font.monoBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: color.paper,
  },
  langOnText: {
    color: color.onyx,
  },
});
