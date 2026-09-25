import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import CaseSections from "@/components/project/CaseSections";
import { getProject } from "@/content/projects";
import { CASE_STUDIES } from "@/content/case-studies";
import MediaFrame from "@/components/project/MediaFrame";
import ArchitectureDiagram from "./ArchitectureDiagram";
const project = getProject("alfred");
const copy = CASE_STUDIES["alfred"];
export const metadata: Metadata = { title: project.title, description: project.blurb };
export default function Page() { return <ProjectLayout project={project} role={copy.role}><MediaFrame caption="Integration architecture. This diagram is not a product screenshot."><ArchitectureDiagram /></MediaFrame><CaseSections sections={copy.sections} /></ProjectLayout>; }
