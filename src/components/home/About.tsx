import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import StackSplit from "@/components/about/StackSplit";

export default function About() {
  return (
    <section id="about" className="scroll-mt-24 py-section">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="mono-label">About</p>
          <p className="mt-6 max-w-3xl font-heading text-2xl font-medium leading-snug sm:text-3xl">
            I&rsquo;m a Computer Engineering student at Texas A&amp;M, Class of
            2028. Summer 2026 I&rsquo;m studying computer architecture at
            Queen&rsquo;s University Belfast, including work with AMD Ireland.
            I build across the whole stack — from RFID timing hardware to
            agentic AI dashboards.
          </p>
          <Link
            href="/about"
            className="mono-label mt-6 inline-block text-copper transition-colors hover:text-copper-bright"
          >
            More about me →
          </Link>
        </Reveal>

        <Reveal delay={0.1} className="mt-16">
          <StackSplit />
        </Reveal>
      </div>
    </section>
  );
}
