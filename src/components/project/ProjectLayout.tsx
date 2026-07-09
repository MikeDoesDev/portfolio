import type { ReactNode } from "react";
import type { Project } from "@/content/projects";
import MetaTags from "./MetaTags";
import NextProject from "./NextProject";
import Reveal from "@/components/motion/Reveal";

interface ProjectLayoutProps {
  project: Project;
  /** One paragraph stating Andrew's role, rendered under the title. */
  role: string;
  children: ReactNode;
}

/**
 * Case-study shell: title hero → role paragraph → meta row → bespoke body
 * zones (children) → next-project strip.
 */
export default function ProjectLayout({ project, role, children }: ProjectLayoutProps) {
  return (
    <article className="pt-32">
      <header className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="mono-label mb-4 text-copper">{project.tagline}</p>
          <h1 className="font-heading text-[length:var(--text-title)] font-bold leading-[1.05]">
            {project.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">{role}</p>
        </Reveal>
        <div className="mt-10">
          <MetaTags project={project} />
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-20 px-5 py-20 sm:px-8">{children}</div>
      <NextProject currentSlug={project.slug} />
    </article>
  );
}
