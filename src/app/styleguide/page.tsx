import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import ProjectCard from "@/components/home/ProjectCard";
import Experience from "@/components/home/Experience";
import { PROJECTS } from "@/content/projects";
export const metadata: Metadata = { title: "Design reference", robots: { index: false, follow: false } };
export default function Styleguide() { return <><div className="site-width"><p className="section-note mt-8">Design reference · cream, sage, and a quieter reading rhythm</p></div><Hero /><section className="site-width section-space"><div className="section-heading"><h2>Featured project composition</h2><p>Real work, readable copy, visible evidence.</p></div><ProjectCard project={PROJECTS[0]} /></section><Experience /></>; }
