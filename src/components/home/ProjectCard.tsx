import Image from "next/image";
import Link from "next/link";
import { STATUS_LABEL, type Project } from "@/content/projects";
export default function ProjectCard({ project, compact = false }: { project: Project; compact?: boolean }) {
  return <article className={compact ? "project-compact" : "project-feature"}>
    {!compact && project.media && <Link href={`/projects/${project.slug}`} className="project-image" aria-label={`Read about ${project.title}`}><Image src={project.media.src} alt={project.media.alt} width={project.media.width} height={project.media.height} sizes="(max-width: 700px) 100vw, 480px" /><span className="image-caption">{project.media.caption}</span></Link>}
    <div className="project-description"><p className="project-status">{STATUS_LABEL[project.status]} <span aria-hidden="true">/</span> {project.timeframe}</p><h3><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3><p>{project.blurb}</p><p className="project-tools">{project.tags.slice(0, 3).join(" / ")}</p><div className="project-actions"><Link className="text-link" href={`/projects/${project.slug}`}>Read the project</Link>{project.links?.slice(0, 1).map(link => <a className="text-link" key={link.href} href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{link.label}</a>)}</div></div>
  </article>;
}
