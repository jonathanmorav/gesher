import { getHeadlines } from "@/lib/headlines.server";

export const revalidate = 180;

export async function GET() {
  const payload = await getHeadlines();
  return Response.json(payload);
}
