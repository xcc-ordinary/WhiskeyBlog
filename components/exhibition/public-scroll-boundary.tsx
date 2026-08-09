"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SmoothScrollProvider } from "@/components/exhibition/smooth-scroll-provider";
import { isPublicScrollPath } from "@/lib/scroll-eligibility";

export function PublicScrollBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (!isPublicScrollPath(pathname)) return <>{children}</>;

  return <SmoothScrollProvider>{children}</SmoothScrollProvider>;
}
