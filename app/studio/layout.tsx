import type { ReactNode } from "react";
import { StudioShell } from "@/components/studio/studio-shell";
import "./studio.css";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <StudioShell>{children}</StudioShell>;
}
