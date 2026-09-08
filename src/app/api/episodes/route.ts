import { getEpisodes } from "@/lib/episodes.server";

export const revalidate = 900;

export async function GET() {
  const payload = await getEpisodes();
  return Response.json(payload);
}
