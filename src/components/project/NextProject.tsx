import Link from "next/link";
import { nextProject } from "@/content/projects";

export default function NextProject({ currentSlug }: { currentSlug: string }) {
  const next = nextProject(currentSlug);
  return (
    <Link
      href={`/projects/${next.slug}`}
      className="group mt-section block border-t border-line bg-surface"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="mono-label mb-3">Next project</p>
        <p className="font-heading text-3xl font-bold transition-colors group-hover:text-copper sm:text-5xl">
          {next.title}
          <span className="ml-3 inline-block transition-transform group-hover:translate-x-2">→</span>
        </p>
        <p className="mt-2 text-muted">{next.tagline}</p>
      </div>
    </Link>
  );
}
