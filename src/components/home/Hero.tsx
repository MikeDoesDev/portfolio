import { HOME, UI } from "@/content/copy";
import { EMAIL, GITHUB_URL, LINKEDIN_URL, RESUME_PATH } from "@/lib/site";
export default function Hero() {
  return <section className="site-width hero" aria-labelledby="greeting">
    <p className="availability"><span aria-hidden="true" />{HOME.availability}</p>
    <h1 id="greeting">{HOME.greeting}</h1>
    <p className="hero-school">{HOME.school}</p><p className="hero-intro">{HOME.introduction}</p>
    <div className="hero-links"><a className="button-primary" href="#work">View projects</a><a className="text-link" href={RESUME_PATH}>{UI.resume} <span className="file-label">PDF</span></a><a className="text-link" href={`mailto:${EMAIL}`}>Email</a><a className="text-link" href={GITHUB_URL}>GitHub</a><a className="text-link" href={LINKEDIN_URL}>LinkedIn</a></div>
  </section>;
}
