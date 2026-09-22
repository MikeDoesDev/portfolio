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

/** Hardware × Software columns with the copper divider. Shared by the home
 *  section and the About page so the two can never drift apart. */
export default function StackSplit() {
  return (
    <div className="relative flex flex-col gap-12 md:flex-row md:gap-0">
      <div className="flex md:flex-1 md:pr-14">
        <StackColumn title="Hardware" items={HARDWARE} />
      </div>

      {/* copper divider — the brand statement */}
      <div aria-hidden="true" className="relative hidden w-px self-stretch md:block">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-copper to-transparent" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-ink px-1 py-2 font-heading text-3xl font-bold text-copper">
          ×
        </span>
      </div>
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-copper to-transparent md:hidden"
      />

      <div className="flex md:flex-1 md:pl-14">
        <StackColumn title="Software" items={SOFTWARE} />
      </div>
    </div>
  );
}
