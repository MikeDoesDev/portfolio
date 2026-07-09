import Reveal from "@/components/motion/Reveal";
import { EMAIL, GITHUB_URL, LINKEDIN_URL, RESUME_PATH } from "@/lib/site";

const LINKS = [
  { label: "LinkedIn", href: LINKEDIN_URL, external: true },
  { label: "GitHub", href: GITHUB_URL, external: true },
  { label: "Resume PDF", href: RESUME_PATH, external: false },
];

export default function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-24 py-section">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="mono-label">Contact</p>
          <h2 className="mt-4 max-w-3xl font-heading text-title font-bold leading-none tracking-tight">
            Let&rsquo;s build something real.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <a
            href={`mailto:${EMAIL}`}
            className="mt-10 inline-block break-all font-heading text-2xl font-bold text-copper underline decoration-copper/30 underline-offset-8 transition-colors hover:text-copper-bright hover:decoration-copper-bright sm:text-4xl"
          >
            {EMAIL}
          </a>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
            {LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono-label transition-colors hover:text-copper"
                >
                  {link.label} ↗
                </a>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  download
                  className="mono-label transition-colors hover:text-copper"
                >
                  {link.label} ↓
                </a>
              ),
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
