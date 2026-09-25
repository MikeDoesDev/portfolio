import Link from "next/link";
import { HOME, UI } from "@/content/copy";
export default function About() { return <section className="site-width section-space home-about"><h2>{HOME.aboutTitle}</h2><div><p>{HOME.about}</p><Link className="text-link" href="/about">{UI.moreAbout}</Link></div></section>; }
