import Reveal from "@/components/motion/Reveal";

const HARDWARE = [
  "FPGA (Xilinx, Verilog)",
  "Analog & digital circuits",
  "RFID / LLRP",
  "Raspberry Pi",
  "Sensor networks",
  "Lab instrumentation",
];

const SOFTWARE = [
  "Python",
  "C++",
  "Java",
  "TypeScript",
  "Next.js",
  "Claude API / agentic AI",
  "SQLite",
  "FastAPI",
];

function StackColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex-1">
      <h3 className="mono-label text-copper">{title}</h3>
      <ul className="mt-5 space-y-2.5 font-mono text-sm text-fg">
        {items.map((item) => (
          <li key={item} className="flex items-baseline gap-3">
            <span aria-hidden="true" className="text-maroon">
              —
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
        </Reveal>

        <Reveal delay={0.1} className="mt-16">
          <div className="relative flex flex-col gap-12 md:flex-row md:gap-0">
            <div className="md:pr-14 md:flex-1 flex">
              <StackColumn title="Hardware" items={HARDWARE} />
            </div>

            {/* copper divider — the brand statement */}
            <div
              aria-hidden="true"
              className="relative hidden w-px self-stretch md:block"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-copper to-transparent" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-ink px-1 py-2 font-heading text-3xl font-bold text-copper">
                ×
              </span>
            </div>
            <div
              aria-hidden="true"
              className="h-px w-full bg-gradient-to-r from-transparent via-copper to-transparent md:hidden"
            />

            <div className="md:pl-14 md:flex-1 flex">
              <StackColumn title="Software" items={SOFTWARE} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
