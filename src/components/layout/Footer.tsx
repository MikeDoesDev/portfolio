import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { EMAIL, GITHUB_URL, LINKEDIN_URL, RESUME_PATH, SITE_NAME } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="mono-label mb-4 text-copper">Work</p>
          <ul className="space-y-2">
            {PROJECTS.map((p) => (
              <li key={p.slug}>
                <Link href={`/projects/${p.slug}`} className="text-muted transition-colors hover:text-fg">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono-label mb-4 text-copper">Reach out</p>
          <ul className="space-y-2">
            <li>
              <a href={`mailto:${EMAIL}`} className="text-muted transition-colors hover:text-fg">
                Email
              </a>
            </li>
            <li>
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-fg">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-fg">
                GitHub
              </a>
            </li>
            <li>
              <a href={RESUME_PATH} download className="text-muted transition-colors hover:text-fg">
                Resume (PDF)
              </a>
            </li>
          </ul>
        </div>
        <div className="sm:text-right">
          <p className="font-heading text-lg font-bold">{SITE_NAME}</p>
          <p className="mt-2 text-sm text-muted">
            Computer &amp; Electrical Engineering
            <br />
            Texas A&amp;M University · Class of 2028
          </p>
          <p className="mt-6 text-xs text-muted">© {new Date().getFullYear()} {SITE_NAME}</p>
        </div>
      </div>
    </footer>
  );
}
