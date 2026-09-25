import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import CaseSections from "@/components/project/CaseSections";
import ImagingDemo from "@/components/imaging/ImagingDemo";
import { getProject } from "@/content/projects";
import { CASE_STUDIES } from "@/content/case-studies";

const project = getProject("image-processing");
const copy = CASE_STUDIES[project.slug];
export const metadata: Metadata = { title: project.title, description: project.blurb };

export default function Page() {
  return <ProjectLayout project={project} role={copy.role}>
    <section id="demo" className="case-demo">
      <h2>Try it</h2>
      <p>Both demos run in your browser on a TypeScript port of the C++, checked to produce the same bytes.</p>
      <div><ImagingDemo /></div>
    </section>
    <CaseSections sections={copy.sections} />
  </ProjectLayout>;
}
