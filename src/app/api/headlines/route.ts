import { getHeadlines } from "@/lib/headlines";

export const revalidate = 180;

export async function GET() {
  const payload = await getHeadlines();
  return Response.json(payload);
}
