import type { Metadata } from "next";

import { CoastalProjectBooks } from "@/components/exhibition/coastal-project-books";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "项目",
  description: "WhiskeyBlog 的项目案例、实验与持续学习记录。",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return <CoastalProjectBooks projects={getProjects()} />;
}
