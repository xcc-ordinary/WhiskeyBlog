import Link from "next/link";
import type { JSX, ReactNode } from "react";

export function EditorialButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }): JSX.Element {
  return (
    <Link className={`editorial-button editorial-button-${variant}`} href={href}>
      {children}
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
