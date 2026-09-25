import { EXPERIENCE } from "@/content/copy";
export default function Experience() {
  return <section id="experience" className="site-width section-space experience-section"><div className="section-heading"><h2>Experience & involvement</h2><p>Engineering, leadership, and teaching.</p></div><div className="experience-list">{EXPERIENCE.map((item, index) => <details className="experience-entry" key={item.organization} open={index === 0}><summary><span className="experience-dot" aria-hidden="true" /><span className="experience-name"><strong>{item.role}</strong><span>{item.organization}</span></span><span className="experience-date">{item.date}</span><span className="expand-mark" aria-hidden="true" /></summary><p>{item.description}</p></details>)}</div></section>;
}
