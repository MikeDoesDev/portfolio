"use client";

import { useState } from "react";
import { PROJECTS } from "@/content/projects";
import Reveal from "@/components/motion/Reveal";
import ProjectCard from "./ProjectCard";

type View = "grid" | "list";

const VIEWS: { id: View; label: string }[] = [
  { id: "grid", label: "Cards" },
  { id: "list", label: "List" },
];

export default function ProjectsSection() {
  const [view, setView] = useState<View>("grid");

  return (
    <section id="work" className="scroll-mt-24 py-section">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mono-label">Selected work</p>
              <h2 className="mt-3 font-heading text-title font-bold leading-none tracking-tight">
                Things I&rsquo;ve built
              </h2>
            </div>

            <div
              role="group"
              aria-label="Project view"
              className="flex items-center gap-1 rounded-full border border-line p-1"
            >
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={view === v.id}
                  onClick={() => setView(v.id)}
                  className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                    view === v.id
                      ? "bg-raised text-copper"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {view === "grid" ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {PROJECTS.map((project, i) => (
              <Reveal
                key={project.slug}
                delay={i * 0.08}
                className={project.headliner ? "md:col-span-2" : undefined}
              >
                <ProjectCard project={project} view="grid" />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-12 border-t border-line">
            {PROJECTS.map((project, i) => (
              <Reveal key={project.slug} delay={i * 0.05}>
                <ProjectCard project={project} view="list" />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
