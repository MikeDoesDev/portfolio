import Link from "next/link";
import ScrollProgress from "@/components/layout/ScrollProgress";
import { RESUME_PATH } from "@/lib/site";
import { UI } from "@/content/copy";
export default function Navbar() { return <header className="site-header"><nav className="site-width nav-inner" aria-label="Main navigation"><Link href="/" className="wordmark" aria-label="Andrew Coggins, home">amc<span aria-hidden="true">.</span></Link><div className="nav-links"><Link href="/#work">{UI.work}</Link><Link href="/#experience">{UI.experience}</Link><Link href="/about">{UI.about}</Link><a href={RESUME_PATH}>{UI.resume}</a></div></nav><ScrollProgress /></header>; }
