import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import CaseSections from "@/components/project/CaseSections";
import DatapathExplorer from "@/components/processor/DatapathExplorer";
import { getProject } from "@/content/projects";
import { CASE_STUDIES } from "@/content/case-studies";

const project = getProject("single-cycle-processor");
const copy = CASE_STUDIES[project.slug];
export const metadata: Metadata = { title: project.title, description: project.blurb };

export default function Page() {
  return <ProjectLayout project={project} role={copy.role}>
    <section id="explorer" className="case-demo">
      <h2>Step through the simulation</h2>
      <p>Every value below was recorded from an Icarus Verilog run of the processor&apos;s testbench. Step through either test program and watch each instruction take its path through the datapath.</p>
      <div><DatapathExplorer /></div>
    </section>
    <CaseSections sections={copy.sections} />
  </ProjectLayout>;
}
