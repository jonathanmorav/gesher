import { NewsRiver } from "@/components/NewsRiver";
import { SiteShell } from "@/components/SiteShell";
import { getHeadlines } from "@/lib/headlines";

export const revalidate = 180;

export default async function Home() {
  const payload = await getHeadlines();

  return (
    <SiteShell>
      <NewsRiver initial={payload} />
    </SiteShell>
  );
}
