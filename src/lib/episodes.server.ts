import { unstable_cache } from "next/cache";
import { fetchAllEpisodes } from "./episodes";

export const getEpisodes = unstable_cache(fetchAllEpisodes, ["klali-episodes-v7"], {
  revalidate: 900,
});

export type { Episode, EpisodeError, EpisodesPayload } from "./episodes";
