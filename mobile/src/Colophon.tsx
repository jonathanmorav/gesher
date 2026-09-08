import { Pressable, StyleSheet, Text, View } from "react-native";
import { PODCASTS, SOURCES, podcastName, sourceName } from "./gesher";
import { useLocale } from "./locale";
import { openUrl } from "./open";
import { color, font } from "./theme";

export function Colophon({ kind }: { kind: "news" | "podcasts" }) {
  const { locale, rtl, t } = useLocale();

  if (kind === "podcasts") {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.text, rtl && styles.rtl]}>{t("podcastsColophon")}</Text>
        <View style={[styles.line, rtl && styles.rowRtl]}>
          <Text style={styles.label}>{t("shows")}</Text>
          {PODCASTS.map((show, index) => (
            <Pressable key={show.id} onPress={() => void openUrl(show.homepage)}>
              <Text style={styles.link}>
                {index > 0 ? " · " : ""}
                {podcastName(show, locale)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.text, rtl && styles.rtl]}>{t("colophon")}</Text>
      <View style={[styles.line, rtl && styles.rowRtl]}>
        <Text style={styles.label}>{t("sources")}</Text>
        {SOURCES.map((source, index) => (
          <Pressable key={source.id} onPress={() => void openUrl(source.homepage)}>
            <Text style={styles.link}>
              {index > 0 ? " · " : ""}
              {sourceName(source, locale)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 28,
    paddingHorizontal: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: color.iron,
    gap: 10,
  },
  text: {
    color: color.fog,
    fontFamily: font.serif,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.16,
  },
  rtl: {
    textAlign: "right",
  },
  rowRtl: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
  },
  line: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  label: {
    color: color.mint,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginEnd: 6,
  },
  link: {
    color: color.silver,
    fontFamily: font.sansMedium,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
});
