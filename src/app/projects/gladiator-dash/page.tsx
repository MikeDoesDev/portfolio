import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import CaseSections from "@/components/project/CaseSections";
import { getProject } from "@/content/projects";
import { CASE_STUDIES } from "@/content/case-studies";
import MediaFrame from "@/components/project/MediaFrame";
import TimingDiagram from "./TimingDiagram";
const project = getProject("gladiator-dash");
const copy = CASE_STUDIES["gladiator-dash"];
export const metadata: Metadata = { title: project.title, description: project.blurb };
export default function Page() { return <ProjectLayout project={project} role={copy.role}><MediaFrame caption="Proposed timing pipeline, not a deployed system."><TimingDiagram /></MediaFrame><CaseSections sections={copy.sections} /></ProjectLayout>; }
