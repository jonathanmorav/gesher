import { Heebo_400Regular, Heebo_700Bold, Heebo_800ExtraBold } from "@expo-google-fonts/heebo";
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AudioHub } from "./src/audio";
import { LocaleProvider } from "./src/locale";
import { Masthead, type ScreenId } from "./src/Masthead";
import { NewsScreen } from "./src/NewsScreen";
import { PodcastsScreen } from "./src/PodcastsScreen";
import { RadioDock } from "./src/RadioDock";
import { color } from "./src/theme";

void SplashScreen.preventAutoHideAsync();

function Root() {
  const [screen, setScreen] = useState<ScreenId>("news");

  return (
    <View style={styles.shell}>
      <StatusBar style="dark" />
      <Masthead screen={screen} onScreen={setScreen} />
      <View style={styles.body}>{screen === "news" ? <NewsScreen /> : <PodcastsScreen />}</View>
      <RadioDock />
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    Heebo_400Regular,
    Heebo_700Bold,
    Heebo_800ExtraBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <AudioHub>
          <Root />
        </AudioHub>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: color.board,
  },
  body: {
    flex: 1,
  },
});
