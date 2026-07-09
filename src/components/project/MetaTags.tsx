import type { Project } from "@/content/projects";
import { STATUS_LABEL } from "@/content/projects";

export default function MetaTags({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4">
      <ul className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-maroon/60 px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted"
          >
            {tag}
          </li>
        ))}
      </ul>
      <span className="mono-label">
        {STATUS_LABEL[project.status]} · {project.timeframe}
      </span>
      {project.links?.map((link) => (
        <a
          key={link.href}
          href={link.href}
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="mono-label text-copper transition-colors hover:text-copper-bright"
        >
          {link.label} ↗
        </a>
      ))}
    </div>
  );
}
