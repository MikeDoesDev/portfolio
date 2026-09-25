import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import CaseSections from "@/components/project/CaseSections";
import { getProject } from "@/content/projects";
import { CASE_STUDIES } from "@/content/case-studies";
import EmbedFrame from "@/components/project/EmbedFrame";
const project = getProject("wit");
const copy = CASE_STUDIES["wit"];
export const metadata: Metadata = { title: project.title, description: project.blurb };
export default function Page() { return <ProjectLayout project={project} role={copy.role}><section id="demo" className="case-demo"><h2>Try the habit tracker</h2><p>A working prototype with seeded example history. Changes save in this browser only.</p><div><EmbedFrame src="/demos/wit/index.html#system" title="WIT habit tracker" /></div></section><CaseSections sections={copy.sections} /></ProjectLayout>; }
