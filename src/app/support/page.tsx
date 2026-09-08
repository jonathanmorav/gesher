import { SupportCopy } from "@/components/LegalCopy";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "גשר — תמיכה",
  description: "תמיכה בגשר: כותרות ישראל, רדיו חי ופודקאסטים.",
};

export default function SupportPage() {
  return (
    <SiteShell>
      <SupportCopy />
    </SiteShell>
  );
}
