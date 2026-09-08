import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_STATION_ID,
  STATION_BY_ID,
  STATION_STORAGE_KEY,
  isStationId,
  stationName,
  type Episode,
  type Locale,
  type Station,
  type StationId,
} from "./gesher";
import { useLocale } from "./locale";

type RadioError = "playError" | "streamDown" | null;

type AudioContextValue = {
  stationId: StationId;
  station: Station;
  radioPlaying: boolean;
  radioLoading: boolean;
  radioError: RadioError;
  toggleRadio: () => void;
  selectStation: (id: StationId) => void;
  currentEpisode: Episode | null;
  podcastPlaying: boolean;
  podcastLoading: boolean;
  toggleEpisode: (episode: Episode) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

function configureSession() {
  return setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "doNotMix",
  });
}

export function AudioHub({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const radioRef = useRef<AudioPlayer | null>(null);
  const podcastRef = useRef<AudioPlayer | null>(null);
  const playGen = useRef(0);
  const streamIndex = useRef(0);
  const streamsRef = useRef<string[]>([]);

  const [stationId, setStationId] = useState<StationId>(DEFAULT_STATION_ID);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);
  const [radioError, setRadioError] = useState<RadioError>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [podcastPlaying, setPodcastPlaying] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);

  const station = STATION_BY_ID[stationId];

  useEffect(() => {
    void configureSession();
    void AsyncStorage.getItem(STATION_STORAGE_KEY).then((value) => {
      if (isStationId(value)) setStationId(value);
    });

    const radio = createAudioPlayer(null);
    const podcast = createAudioPlayer(null);
    radioRef.current = radio;
    podcastRef.current = podcast;

    const radioSub = radio.addListener("playbackStatusUpdate", (status) => {
      if (status.error) return;
      setRadioPlaying(status.playing);
      if (status.playing) setRadioLoading(false);
    });
    const podcastSub = podcast.addListener("playbackStatusUpdate", (status) => {
      setPodcastPlaying(status.playing);
      if (status.playing) setPodcastLoading(false);
      if (status.didJustFinish) setPodcastPlaying(false);
    });

    return () => {
      radioSub.remove();
      podcastSub.remove();
      radio.remove();
      podcast.remove();
      radioRef.current = null;
      podcastRef.current = null;
    };
  }, []);

  const stopPodcast = useCallback(() => {
    const podcast = podcastRef.current;
    podcast?.pause();
    podcast?.clearLockScreenControls();
    setPodcastPlaying(false);
    setPodcastLoading(false);
  }, []);

  const stopRadio = useCallback(() => {
    playGen.current += 1;
    const radio = radioRef.current;
    radio?.pause();
    radio?.clearLockScreenControls();
    setRadioPlaying(false);
    setRadioLoading(false);
  }, []);

  const playRadioFrom = useCallback(
    async (index: number, streams: string[], next: Station, locale: Locale) => {
      const radio = radioRef.current;
      if (!radio || streams.length === 0) return;

      const gen = playGen.current;
      streamsRef.current = streams;
      streamIndex.current = index;
      setRadioLoading(true);
      setRadioError(null);
      stopPodcast();
      await configureSession();

      try {
        radio.replace(streams[index]);
        radio.play();
        radio.setActiveForLockScreen(true, {
          title: stationName(next, locale),
          artist: "גשר",
          albumTitle: next.freq,
        });
        if (gen !== playGen.current) return;
        setRadioPlaying(true);
      } catch {
        if (gen !== playGen.current) return;
        if (index < streams.length - 1) {
          await playRadioFrom(index + 1, streams, next, locale);
          return;
        }
        setRadioPlaying(false);
        setRadioError("playError");
      } finally {
        if (gen === playGen.current) setRadioLoading(false);
      }
    },
    [stopPodcast],
  );

  const startRadio = useCallback(
    async (next: Station = station, locale: Locale = "he") => {
      try {
        await playRadioFrom(0, next.streams, next, locale);
      } catch {
        setRadioPlaying(false);
        setRadioLoading(false);
        setRadioError("streamDown");
      }
    },
    [playRadioFrom, station],
  );

  const toggleRadio = useCallback(() => {
    if (radioPlaying || radioLoading) {
      stopRadio();
      return;
    }
    void startRadio(station, locale);
  }, [locale, radioLoading, radioPlaying, startRadio, station, stopRadio]);

  const selectStation = useCallback(
    (id: StationId) => {
      if (id === stationId) return;
      const wasPlaying = radioPlaying || radioLoading;
      stopRadio();
      setStationId(id);
      setRadioError(null);
      void AsyncStorage.setItem(STATION_STORAGE_KEY, id);
      if (wasPlaying) void startRadio(STATION_BY_ID[id], locale);
    },
    [locale, radioLoading, radioPlaying, startRadio, stationId, stopRadio],
  );

  const toggleEpisode = useCallback(
    (episode: Episode) => {
      const podcast = podcastRef.current;
      if (!podcast) return;

      if (currentEpisode?.id === episode.id && podcastPlaying) {
        stopPodcast();
        return;
      }

      stopRadio();
      setCurrentEpisode(episode);
      setPodcastLoading(true);
      void configureSession().then(() => {
        podcast.replace(episode.audioUrl);
        podcast.play();
        podcast.setActiveForLockScreen(true, {
          title: episode.title,
          artist: "גשר",
          albumTitle: locale === "en" ? "Podcasts" : "פודקאסטים",
        });
        setPodcastPlaying(true);
        setPodcastLoading(false);
      });
    },
    [currentEpisode?.id, locale, podcastPlaying, stopPodcast, stopRadio],
  );

  const value = useMemo<AudioContextValue>(
    () => ({
      stationId,
      station,
      radioPlaying,
      radioLoading,
      radioError,
      toggleRadio,
      selectStation,
      currentEpisode,
      podcastPlaying,
      podcastLoading,
      toggleEpisode,
    }),
    [
      currentEpisode,
      podcastLoading,
      podcastPlaying,
      radioError,
      radioLoading,
      radioPlaying,
      selectStation,
      station,
      stationId,
      toggleEpisode,
      toggleRadio,
    ],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudioHub() {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudioHub must be used within AudioHub");
  return context;
}
