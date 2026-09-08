import { PodcastBoard } from "@/components/PodcastBoard";
import { SiteShell } from "@/components/SiteShell";
import { getEpisodes } from "@/lib/episodes";

export const revalidate = 900;

export const metadata = {
  title: "גשר — פודקאסטים",
  description: "הפרקים האחרונים מפודקאסטים על ישראל ועל החיים היהודיים בעולם.",
};

export default async function PodcastsPage() {
  const payload = await getEpisodes();

  return (
    <SiteShell footer="podcasts">
      <PodcastBoard initial={payload} />
    </SiteShell>
  );
}
