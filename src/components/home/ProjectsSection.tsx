import { PROJECTS } from "@/content/projects";
import { HOME } from "@/content/copy";
import ProjectCard from "./ProjectCard";
export default function ProjectsSection() {
  return <section id="work" className="site-width section-space">
    <div className="section-heading"><h2>{HOME.workTitle}</h2><p>{HOME.workNote}</p></div>
    <div className="featured-work">{PROJECTS.filter(p => p.group === "featured").map(p => <ProjectCard key={p.slug} project={p} />)}</div>
    <div className="workbench"><div className="section-heading"><h3>{HOME.ongoingTitle}</h3><p>{HOME.ongoingNote}</p></div>{PROJECTS.filter(p => p.group !== "featured").map(p => <ProjectCard key={p.slug} project={p} compact />)}</div>
  </section>;
}
