import { useEffect } from "react";
import { Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { Metrics } from "react-native-safe-area-context";
import { color, font } from "./theme";

export const IPHONE = { width: 393, height: 852 } as const;
const BEZEL = 14;

export const IPHONE_SAFE_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: IPHONE.width, height: IPHONE.height },
  insets: { top: 54, left: 0, right: 0, bottom: 34 },
};

function frameQueryDisabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("frame") === "0";
}

export function usePhoneFrame() {
  const { width, height } = useWindowDimensions();
  return Platform.OS === "web" && !frameQueryDisabled() && width >= 560 && height >= 640;
}

export function PhonePreview({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const outerW = IPHONE.width + BEZEL * 2;
  const outerH = IPHONE.height + BEZEL * 2;
  const scale = Math.min(1, (width - 64) / outerW, (height - 108) / outerH);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const prev = {
      html: html.style.background,
      body: body.style.background,
      overflow: body.style.overflow,
    };
    html.style.background = color.charcoal;
    body.style.background = color.charcoal;
    body.style.overflow = "hidden";
    if (root) root.style.background = color.charcoal;
    return () => {
      html.style.background = prev.html;
      body.style.background = prev.body;
      body.style.overflow = prev.overflow;
    };
  }, []);

  return (
    <View style={styles.desk}>
      <Text style={styles.caption}>גשר · iPhone 16 · click through</Text>
      <View style={[styles.stage, { width: outerW * scale, height: outerH * scale }]}>
        <View style={[styles.scaled, { width: outerW, height: outerH, transform: [{ scale }] }]}>
          <View style={styles.bezel}>
            <View style={styles.screen}>
              {children}
              <View pointerEvents="none" style={styles.island} />
              <View pointerEvents="none" style={styles.home} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desk: {
    flex: 1,
    backgroundColor: color.charcoal,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 14,
  },
  caption: {
    color: color.mint,
    fontFamily: font.monoBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  stage: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  scaled: {
    alignItems: "center",
    justifyContent: "center",
  },
  bezel: {
    width: IPHONE.width + BEZEL * 2,
    height: IPHONE.height + BEZEL * 2,
    borderRadius: 62,
    backgroundColor: color.onyx,
    borderWidth: 1,
    borderColor: color.iron,
    padding: BEZEL,
  },
  screen: {
    width: IPHONE.width,
    height: IPHONE.height,
    borderRadius: 48,
    overflow: "hidden",
    backgroundColor: color.charcoal,
  },
  island: {
    position: "absolute",
    top: 11,
    left: IPHONE.width / 2 - 60,
    width: 120,
    height: 36,
    borderRadius: 20,
    backgroundColor: color.onyx,
  },
  home: {
    position: "absolute",
    bottom: 8,
    left: IPHONE.width / 2 - 64,
    width: 128,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
});
