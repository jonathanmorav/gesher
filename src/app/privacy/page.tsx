import { PrivacyCopy } from "@/components/LegalCopy";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "גשר — פרטיות",
  description: "מדיניות הפרטיות של גשר: אין חשבון, אין מעקב, העדפות נשמרות במכשיר.",
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <PrivacyCopy />
    </SiteShell>
  );
}
