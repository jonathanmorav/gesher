import { NewsRiver } from "@/components/NewsRiver";
import { SiteShell } from "@/components/SiteShell";
import { getEpisodes } from "@/lib/episodes";
import { getHeadlines } from "@/lib/headlines";

export const revalidate = 180;

export default async function Home() {
  const [payload, episodes] = await Promise.all([getHeadlines(), getEpisodes()]);

  return (
    <SiteShell>
      <NewsRiver initial={payload} podcasts={episodes.episodes.slice(0, 5)} />
    </SiteShell>
  );
}
