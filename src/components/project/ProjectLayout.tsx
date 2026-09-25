import type { ReactNode } from "react";
import Link from "next/link";
import { STATUS_LABEL, type Project } from "@/content/projects";
import NextProject from "./NextProject";
export default function ProjectLayout({ project, role, children }: { project: Project; role: string; children: ReactNode }) {
  return <article className="site-width"><header className="page-heading"><Link className="case-back" href="/#work">All projects</Link><p className="section-note">{project.tagline}</p><h1>{project.title}</h1><p className="page-lede">{role}</p><div className="case-meta"><span>{STATUS_LABEL[project.status]}</span><span>{project.timeframe}</span><span>{project.tags.join(" / ")}</span></div><div className="case-actions">{project.links?.map(link => <a className="text-link" key={link.href} href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{link.label}</a>)}</div></header><div className="case-body">{children}</div><NextProject currentSlug={project.slug} /></article>;
}
