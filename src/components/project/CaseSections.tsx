import type { CaseStudy } from "@/content/case-studies";
export default function CaseSections({ sections }: Pick<CaseStudy, "sections">) { return <>{sections.map(section => <section className="case-prose" key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(p => <p key={p}>{p}</p>)}</section>)}</>; }
