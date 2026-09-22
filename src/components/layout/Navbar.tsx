import Link from "next/link";
import Monogram from "./Monogram";
import { RESUME_PATH } from "@/lib/site";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Home" className="text-copper transition-colors hover:text-copper-bright">
          <Monogram />
        </Link>
        <div className="flex items-center gap-5 sm:gap-8">
          <Link href="/#work" className="mono-label transition-colors hover:text-fg">
            Work
          </Link>
          <Link href="/about" className="mono-label transition-colors hover:text-fg">
            About
          </Link>
          <Link href="/#contact" className="mono-label transition-colors hover:text-fg">
            Contact
          </Link>
          <a
            href={RESUME_PATH}
            download
            className="rounded-full border border-copper px-4 py-1.5 font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-copper transition-colors hover:bg-copper hover:text-ink"
          >
            Resume
          </a>
        </div>
      </nav>
    </header>
  );
}
