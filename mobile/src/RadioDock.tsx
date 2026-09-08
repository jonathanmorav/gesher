import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STATIONS, stationName } from "./gesher";
import { useAudioHub } from "./audio";
import { useLocale } from "./locale";
import { color, font, radius } from "./theme";

export function RadioDock() {
  const { locale, rtl, t } = useLocale();
  const { stationId, station, radioPlaying, radioLoading, radioError, toggleRadio, selectStation } = useAudioHub();
  const insets = useSafeAreaInsets();
  const hebrew = STATIONS.filter((item) => item.lang === "he");
  const english = STATIONS.filter((item) => item.lang === "en");

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.inner, rtl && styles.innerRtl]}>
        <Pressable
          onPress={toggleRadio}
          style={styles.play}
          accessibilityLabel={radioPlaying ? t("pause") : t("play")}
        >
          {radioLoading ? (
            <Text style={styles.playGlyph}>…</Text>
          ) : radioPlaying ? (
            <View style={styles.pause}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          ) : (
            <View style={[styles.triangle, rtl && styles.triangleRtl]} />
          )}
        </Pressable>

        <View style={styles.copy}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.switch, rtl && styles.rowRtl]}
          >
            {hebrew.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => selectStation(item.id)}
                style={[styles.chip, item.id === stationId && styles.chipOn]}
              >
                <Text style={[styles.chipText, item.id === stationId && styles.chipOnText]}>
                  {stationName(item, locale)}
                </Text>
              </Pressable>
            ))}
            <Text style={styles.sep}>|</Text>
            {english.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => selectStation(item.id)}
                style={[styles.chip, item.id === stationId && styles.chipOn]}
              >
                <Text style={[styles.chipText, item.id === stationId && styles.chipOnText]}>
                  {stationName(item, locale)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={[styles.row, rtl && styles.rowRtl]}>
            <Text style={[styles.live, radioPlaying && styles.liveOn]}>{t("live")}</Text>
            <Text style={styles.station}>{stationName(station, locale)}</Text>
            {station.freq ? <Text style={styles.freq}>{station.freq}</Text> : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {radioError ? t(radioError) : station.blurb[locale]}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    backgroundColor: color.onyx,
    borderTopWidth: 1,
    borderTopColor: color.mint,
  },
  inner: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  innerRtl: {
    flexDirection: "row-reverse",
  },
  rowRtl: {
    flexDirection: "row-reverse",
  },
  play: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  playGlyph: {
    color: color.onyx,
    fontSize: 18,
    fontFamily: font.sansBold,
  },
  pause: {
    flexDirection: "row",
    gap: 4,
  },
  pauseBar: {
    width: 5,
    height: 14,
    backgroundColor: color.onyx,
  },
  triangle: {
    width: 0,
    height: 0,
    marginLeft: 3,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 14,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: color.onyx,
  },
  triangleRtl: {
    marginLeft: 0,
    marginRight: 3,
    borderLeftWidth: 0,
    borderRightWidth: 14,
    borderRightColor: color.onyx,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  switch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: color.mist,
    borderRadius: radius.button,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: color.charcoal,
  },
  chipOn: {
    backgroundColor: color.mint,
    borderColor: color.mint,
  },
  chipText: {
    color: color.paper,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  chipOnText: {
    color: color.onyx,
  },
  sep: {
    color: color.iron,
    paddingHorizontal: 2,
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  live: {
    color: color.fog,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  liveOn: {
    color: color.mint,
  },
  station: {
    color: color.paper,
    fontFamily: font.sansBold,
    fontSize: 18,
    letterSpacing: 0.36,
  },
  freq: {
    color: color.mint,
    fontFamily: font.monoMed,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  meta: {
    marginTop: 6,
    color: color.fog,
    fontFamily: font.serif,
    fontSize: 13,
    letterSpacing: -0.13,
  },
});
