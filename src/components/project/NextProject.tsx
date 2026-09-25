import Link from "next/link";
import { nextProject } from "@/content/projects";
export default function NextProject({ currentSlug }: { currentSlug: string }) { const next = nextProject(currentSlug); return <Link className="next-project" href={`/projects/${next.slug}`}><span>Next project</span><strong>{next.title}</strong></Link>; }
