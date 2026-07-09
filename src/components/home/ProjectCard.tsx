import Link from "next/link";
import { STATUS_LABEL, type Project } from "@/content/projects";

interface ProjectCardProps {
  project: Project;
  view: "grid" | "list";
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span className="rounded-full border border-maroon px-2.5 py-0.5 font-mono text-xs text-muted">
      {tag}
    </span>
  );
}

export default function ProjectCard({ project, view }: ProjectCardProps) {
  const href = `/projects/${project.slug}`;

  if (view === "list") {
    return (
      <Link
        href={href}
        className="group flex items-baseline gap-4 border-b border-line py-5 transition-colors hover:border-copper sm:items-center"
      >
        <h3 className="min-w-0 shrink-0 font-heading text-lg font-bold transition-colors group-hover:text-copper sm:text-xl">
          {project.title}
        </h3>
        <span className="hidden min-w-0 flex-1 truncate font-mono text-xs text-muted md:block">
          {project.tags.join(" · ")}
        </span>
        <span className="ml-auto shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-muted">
          {project.timeframe}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 text-copper transition-transform duration-300 group-hover:translate-x-1.5"
        >
          →
        </span>
      </Link>
    );
  }

  const headliner = project.headliner;

  return (
    <Link
      href={href}
      className={`group relative flex h-full flex-col rounded-xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-copper hover:shadow-[0_0_32px_rgba(232,163,61,0.14)] ${
        headliner ? "p-7 sm:p-10" : "p-7"
      }`}
    >
      <div className="mono-label flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span
          className={
            project.status === "in-progress" ? "text-signal" : undefined
          }
        >
          {STATUS_LABEL[project.status]}
        </span>
        <span aria-hidden="true" className="text-line">
          /
        </span>
        <span>{project.timeframe}</span>
      </div>

      <h3
        className={`mt-4 font-heading font-bold transition-colors group-hover:text-copper ${
          headliner ? "text-3xl sm:text-4xl" : "text-2xl"
        }`}
      >
        {project.title}
      </h3>
      <p className="mt-1 font-mono text-sm text-copper">{project.tagline}</p>
      <p className={`mt-4 text-muted ${headliner ? "max-w-2xl" : "text-sm"}`}>
        {project.blurb}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
        <span
          aria-hidden="true"
          className="shrink-0 text-xl text-copper transition-transform duration-300 group-hover:translate-x-1.5"
        >
          →
        </span>
      </div>
    </Link>
  );
}
