import { unstable_cache } from "next/cache";
import { fetchAllHeadlines } from "./headlines";

export const getHeadlines = unstable_cache(fetchAllHeadlines, ["klali-headlines-v13"], {
  revalidate: 180,
});

export type { Headline, HeadlinesPayload, SourceError } from "./headlines";
