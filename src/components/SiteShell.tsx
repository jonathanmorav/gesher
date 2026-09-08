import type { ReactNode } from "react";
import { SiteFooter, type FooterKind } from "./SiteFooter";

export function SiteShell({
  children,
  footer = "news",
}: {
  children: ReactNode;
  footer?: FooterKind;
}) {
  return (
    <main className="page">
      {children}
      <SiteFooter kind={footer} />
    </main>
  );
}
