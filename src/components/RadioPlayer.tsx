"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  DEFAULT_STATION_ID,
  STATIONS,
  STATION_BY_ID,
  STATION_STORAGE_KEY,
  isStationId,
  stationName,
  type Station,
  type StationId,
} from "@/lib/stations";
import { useLocale } from "./LocaleProvider";

function isHls(url: string) {
  return /\.m3u8(\?|$)/i.test(url);
}

export function RadioPlayer() {
  const { locale, t } = useLocale();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const streamIndex = useRef(0);
  const streamsRef = useRef<string[]>([]);
  const playGen = useRef(0);
  const [stationId, setStationId] = useState<StationId>(DEFAULT_STATION_ID);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [errorKey, setErrorKey] = useState<"playError" | "streamDown" | null>(null);

  const station = STATION_BY_ID[stationId];
  const hebrew = STATIONS.filter((item) => item.lang === "he");
  const english = STATIONS.filter((item) => item.lang === "en");

  useEffect(() => {
    const storedVolume = window.localStorage.getItem("klali-volume");
    if (storedVolume) {
      const next = Number(storedVolume);
      if (!Number.isNaN(next)) setVolume(Math.min(1, Math.max(0, next)));
    }

    const storedStation = window.localStorage.getItem(STATION_STORAGE_KEY);
    if (isStationId(storedStation)) setStationId(storedStation);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    window.localStorage.setItem("klali-volume", String(volume));
  }, [volume]);

  function teardownHls() {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }

  async function attach(url: string) {
    const audio = audioRef.current;
    if (!audio) return;

    teardownHls();

    if (isHls(url)) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          xhrSetup(xhr) {
            xhr.withCredentials = false;
          },
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(audio);
        await new Promise<void>((resolve, reject) => {
          hls.on(Hls.Events.MANIFEST_PARSED, () => resolve());
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) reject(new Error("hls"));
          });
        });
        return;
      }

      if (audio.canPlayType("application/vnd.apple.mpegurl")) {
        audio.src = url;
        return;
      }

      throw new Error("hls");
    }

    audio.src = url;
  }

  async function playFrom(index: number, streams: string[]) {
    const audio = audioRef.current;
    if (!audio || streams.length === 0) return;

    const gen = playGen.current;
    streamsRef.current = streams;
    streamIndex.current = index;
    setLoading(true);
    setErrorKey(null);

    try {
      await attach(streams[index]);
      if (gen !== playGen.current) return;
      await audio.play();
      if (gen !== playGen.current) return;
      setPlaying(true);
    } catch {
      if (gen !== playGen.current) return;
      if (index < streams.length - 1) {
        await playFrom(index + 1, streams);
        return;
      }
      setPlaying(false);
      setErrorKey("playError");
    } finally {
      if (gen === playGen.current) setLoading(false);
    }
  }

  async function start(next: Station = station) {
    try {
      await playFrom(0, next.streams);
    } catch {
      setPlaying(false);
      setLoading(false);
      setErrorKey("streamDown");
    }
  }

  function stop() {
    playGen.current += 1;
    const audio = audioRef.current;
    audio?.pause();
    setPlaying(false);
    setLoading(false);
  }

  function toggle() {
    if (playing || loading) {
      stop();
      return;
    }
    void start();
  }

  function selectStation(id: StationId) {
    if (id === stationId) return;
    const wasPlaying = playing || loading;
    stop();
    teardownHls();
    setStationId(id);
    setErrorKey(null);
    window.localStorage.setItem(STATION_STORAGE_KEY, id);
    if (wasPlaying) void start(STATION_BY_ID[id]);
  }

  useEffect(() => () => teardownHls(), []);

  function handleError() {
    const streams = streamsRef.current;
    if (streamIndex.current < streams.length - 1) {
      void playFrom(streamIndex.current + 1, streams);
      return;
    }
    setPlaying(false);
    setLoading(false);
    setErrorKey("streamDown");
  }

  function chips(items: Station[]) {
    return items.map((item) => (
      <button
        key={item.id}
        type="button"
        role="tab"
        aria-selected={item.id === stationId}
        className={`station-chip ${item.id === stationId ? "active" : ""}`}
        onClick={() => selectStation(item.id)}
      >
        {stationName(item, locale)}
      </button>
    ));
  }

  return (
    <div className="radio-dock">
      <div className="radio-inner">
        <button
          type="button"
          className={`play-btn ${playing ? "is-live" : ""}`}
          onClick={toggle}
          aria-label={playing ? t("pause") : t("play")}
        >
          {loading ? (
            <span className="play-spinner" />
          ) : playing ? (
            <span className="pause-icon" />
          ) : (
            <span className="play-icon" />
          )}
        </button>

        <div className="radio-copy">
          <div className="station-switch" role="tablist" aria-label={t("stationsAria")}>
            {chips(hebrew)}
            <span className="station-sep" aria-hidden>
              |
            </span>
            {chips(english)}
          </div>
          <div className="radio-row">
            <span className={`live-dot ${playing ? "on" : ""}`}>{t("live")}</span>
            <strong className="station">{stationName(station, locale)}</strong>
            {station.freq && <span className="freq">{station.freq}</span>}
          </div>
          <p className="radio-meta">{errorKey ? t(errorKey) : station.blurb[locale]}</p>
        </div>

        <div className="radio-tools">
          <div className={`eq ${playing ? "on" : ""}`} aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </div>
          <label className="volume">
            <span>{t("volume")}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <audio
        ref={audioRef}
        preload="none"
        onError={handleError}
        onPlaying={() => {
          setPlaying(true);
          setLoading(false);
        }}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}
