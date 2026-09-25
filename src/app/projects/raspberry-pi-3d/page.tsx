import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import CaseSections from "@/components/project/CaseSections";
import { getProject } from "@/content/projects";
import { CASE_STUDIES } from "@/content/case-studies";
import EmbedFrame from "@/components/project/EmbedFrame";
const project = getProject("raspberry-pi-3d");
const copy = CASE_STUDIES["raspberry-pi-3d"];
export const metadata: Metadata = { title: project.title, description: project.blurb };
export default function Page() { return <ProjectLayout project={project} role={copy.role}><section id="demo" className="case-demo"><h2>Explore the board</h2><p>Drag to rotate, scroll to zoom, and select a component to inspect it. Requires WebGL and a network connection.</p><div><EmbedFrame src="/demos/raspberry-pi-3d/index.html" title="Raspberry Pi 5 visualizer" /></div></section><CaseSections sections={copy.sections} /></ProjectLayout>; }
