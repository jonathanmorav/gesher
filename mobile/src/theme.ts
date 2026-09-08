import { isHebrew } from "./gesher";

export const color = {
  charcoal: "#131313",
  onyx: "#000000",
  paper: "#ffffff",
  iron: "#313131",
  graphite: "#272727",
  fog: "#949494",
  mist: "#e9e9e9",
  silver: "#c9c9c9",
  mint: "#3cffd0",
  ultraviolet: "#5200ff",
  heat: "#ff3d00",
  forest: "#309875",
  board: "#131313",
  ink: "#ffffff",
  inkSoft: "#949494",
  mute: "#949494",
  line: "#313131",
  red: "#3cffd0",
  radio: "#000000",
  radioMute: "#949494",
  photoBg: "#313131",
} as const;

export const font = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansBold: "Inter_700Bold",
  sansBlack: "Inter_900Black",
  display: "ArchivoBlack_400Regular",
  displayHe: "Heebo_800ExtraBold",
  serif: "SourceSerif4_400Regular",
  mono: "IBMPlexMono_400Regular",
  monoMed: "IBMPlexMono_500Medium",
  monoBold: "IBMPlexMono_700Bold",
} as const;

export const radius = {
  image: 3,
  input: 4,
  card: 20,
  button: 24,
  pill: 9999,
} as const;

export function displayFamily(text: string) {
  return isHebrew(text) ? font.displayHe : font.display;
}

export function sansFamily(text: string, weight: "regular" | "medium" | "bold" | "black" = "regular") {
  if (isHebrew(text) && (weight === "black" || weight === "bold")) return font.displayHe;
  if (weight === "black") return font.sansBlack;
  if (weight === "bold") return font.sansBold;
  if (weight === "medium") return font.sansMedium;
  return font.sans;
}
