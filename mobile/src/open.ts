import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

export async function openUrl(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
    });
  } catch {
    await Linking.openURL(url);
  }
}
