import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STATIONS, stationName } from "./gesher";
import { useAudioHub } from "./audio";
import { useLocale } from "./locale";
import { color, font } from "./theme";

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
          style={[styles.play, radioPlaying && styles.playLive]}
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
    backgroundColor: color.radio,
    borderTopWidth: 2,
    borderTopColor: color.red,
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
    backgroundColor: color.red,
    alignItems: "center",
    justifyContent: "center",
  },
  playLive: {
    shadowColor: color.red,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  playGlyph: {
    color: "#fff",
    fontSize: 18,
    fontFamily: font.sans,
  },
  pause: {
    flexDirection: "row",
    gap: 4,
  },
  pauseBar: {
    width: 5,
    height: 14,
    backgroundColor: "#fff",
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
    borderLeftColor: "#fff",
  },
  triangleRtl: {
    marginLeft: 0,
    marginRight: 3,
    borderLeftWidth: 0,
    borderRightWidth: 14,
    borderRightColor: "#fff",
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
    borderColor: "#2a2a2a",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipOn: {
    backgroundColor: "#1d1d1d",
    borderColor: color.red,
  },
  chipText: {
    color: color.radioMute,
    fontFamily: font.sans,
    fontSize: 12,
  },
  chipOnText: {
    color: "#fff",
  },
  sep: {
    color: "#3a3a3a",
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
    color: color.radioMute,
    fontFamily: font.sans,
    fontSize: 12,
  },
  liveOn: {
    color: color.red,
  },
  station: {
    color: "#fff",
    fontFamily: font.sansBlack,
    fontSize: 20,
  },
  freq: {
    color: color.red,
    fontFamily: font.mono,
    fontSize: 13,
  },
  meta: {
    marginTop: 6,
    color: color.radioMute,
    fontFamily: font.sans,
    fontSize: 13,
  },
});
