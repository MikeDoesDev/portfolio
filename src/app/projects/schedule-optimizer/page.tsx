import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import CaseSections from "@/components/project/CaseSections";
import { getProject } from "@/content/projects";
import { CASE_STUDIES } from "@/content/case-studies";
import MediaFrame from "@/components/project/MediaFrame";
import ScheduleDemo from "./ScheduleDemo";
import PipelineDiagram from "./PipelineDiagram";
const project = getProject("schedule-optimizer");
const copy = CASE_STUDIES["schedule-optimizer"];
export const metadata: Metadata = { title: project.title, description: project.blurb };
export default function Page() { return <ProjectLayout project={project} role={copy.role}><section id="demo" className="case-demo"><h2>Try different priorities</h2><p>This interactive demo uses sample course data. Adjust the weights to see the ranking change.</p><div><ScheduleDemo /></div></section><CaseSections sections={copy.sections} /><MediaFrame caption="The data flow in the scheduling application."><PipelineDiagram /></MediaFrame></ProjectLayout>; }
