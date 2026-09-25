import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import CaseSections from "@/components/project/CaseSections";
import GamesSuite from "@/components/games/GamesSuite";
import { getProject } from "@/content/projects";
import { CASE_STUDIES } from "@/content/case-studies";

const project = getProject("games");
const copy = CASE_STUDIES.games;
export const metadata: Metadata = { title: project.title, description: project.blurb };

export default function Page() {
  return <ProjectLayout project={project} role={copy.role}>
    <section id="play" className="case-demo">
      <h2>Play</h2>
      <p>Pick a game. Each has a table to play at and a lab that runs strategies against each other.</p>
      <div><GamesSuite /></div>
    </section>
    <CaseSections sections={copy.sections} />
  </ProjectLayout>;
}
