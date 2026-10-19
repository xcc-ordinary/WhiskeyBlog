import type { Metadata } from "next";

import { CoastalAbout } from "@/components/exhibition/coastal-about";

export const metadata: Metadata = {
  title: "关于我",
  description: "认识 Wesley：一名学习人工智能、持续把想法做成作品的年轻开发者。",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <CoastalAbout />;
}
