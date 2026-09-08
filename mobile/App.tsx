import { ArchivoBlack_400Regular } from "@expo-google-fonts/archivo-black";
import { Heebo_800ExtraBold } from "@expo-google-fonts/heebo";
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_700Bold } from "@expo-google-fonts/ibm-plex-mono";
import { Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_900Black } from "@expo-google-fonts/inter";
import { SourceSerif4_400Regular } from "@expo-google-fonts/source-serif-4";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
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
void SystemUI.setBackgroundColorAsync(color.charcoal);

function Root() {
  const [screen, setScreen] = useState<ScreenId>("news");

  return (
    <View style={styles.shell}>
      <StatusBar style="light" />
      <Masthead screen={screen} onScreen={setScreen} />
      <View style={styles.body}>{screen === "news" ? <NewsScreen /> : <PodcastsScreen />}</View>
      <RadioDock />
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    ArchivoBlack_400Regular,
    Heebo_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_900Black,
    SourceSerif4_400Regular,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_700Bold,
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
    backgroundColor: color.charcoal,
  },
  body: {
    flex: 1,
  },
});
