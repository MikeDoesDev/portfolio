import { GITHUB_URL, LINKEDIN_URL, SITE_NAME } from "@/lib/site";
export default function Footer() { return <footer className="site-width site-footer"><p>© {new Date().getFullYear()} {SITE_NAME}</p><div><a href={GITHUB_URL}>GitHub</a><a href={LINKEDIN_URL}>LinkedIn</a><a href="#top">Back to top</a></div></footer>; }
