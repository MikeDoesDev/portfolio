import Bookshelf from "@/components/about/Bookshelf";
import GrassWord from "@/components/about/GrassWord";
import OrbitCluster from "@/components/about/OrbitCluster";
import TravelMap from "@/components/about/TravelMap";
import { BOOKSHELF } from "@/content/bookshelf";
import type { Metadata } from "next";
import { ABOUT, HOME, UI } from "@/content/copy";
import { EMAIL, GITHUB_URL, LINKEDIN_URL, INSTAGRAM_URL, LETTERBOXD_URL, EE_RESUME_PATH, SWE_RESUME_PATH } from "@/lib/site";
export const metadata: Metadata = { title: "About", description: "Andrew Michael Coggins, an Electrical and Computer Engineering student at Texas A&M. My background, service, and life outside engineering." };
export default function AboutPage() {
  return <article className="site-width about-page"><header className="page-heading about-intro"><div><p className="section-note">{HOME.school}</p><h1>{ABOUT.title}</h1><p className="page-lede">{ABOUT.introduction}</p></div><OrbitCluster links={[
    { label: "Gmail", href: `mailto:${EMAIL}`, icon: "email" },
    { label: "Instagram", href: INSTAGRAM_URL, icon: "instagram", external: true },
    { label: "GitHub", href: GITHUB_URL, icon: "github", external: true },
    { label: "Letterboxd", href: LETTERBOXD_URL, icon: "letterboxd", external: true },
    { label: "LinkedIn", href: LINKEDIN_URL, icon: "linkedin", external: true },
  ]} photoSrc="/media/about/headshot.webp" photoAlt="Headshot of Andrew Michael Coggins" /></header><div className="about-prose"><section><h2>Where it started</h2>{ABOUT.origin.map(p => <p key={p}>{p}</p>)}</section><section><h2>{ABOUT.serviceTitle}</h2>{ABOUT.service.map(p => <p key={p}>{p}</p>)}</section><section><h2>{ABOUT.outsideTitle[0]} <GrassWord>{ABOUT.outsideTitle[1]}</GrassWord></h2><p>{ABOUT.outside}</p></section><section><h2>{ABOUT.booksTitle}</h2><div className="bookshelf-tile"><Bookshelf shelf={BOOKSHELF} /></div></section><section><h2>{ABOUT.placesTitle}</h2><TravelMap places={ABOUT.places} groups={ABOUT.placeGroups} /></section><section><h2>Resume</h2><div className="resume-links"><a className="text-link" href={EE_RESUME_PATH}>{UI.eeResume} (PDF)</a><a className="text-link" href={SWE_RESUME_PATH}>{UI.sweResume} (PDF)</a></div></section></div></article>;
}
