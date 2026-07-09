// DEV-ONLY pose review page — delete before deploy.
// Renders all four intro poses side by side with CSS-frozen opacities so
// pose geometry can be reviewed without animation timing.

import HandScene from "@/components/intro/HandScene";
import type { IntroPhase } from "@/components/intro/useIntroMachine";

const PINS: { phase: IntroPhase; show: string }[] = [
  { phase: "handshake", show: "pose-profile" },
  { phase: "wave", show: "pose-palm" },
  { phase: "fist", show: "pose-fist" },
  { phase: "reveal", show: "pose-palm pose-monogram" },
];

export default function IntroTestPage() {
  return (
    <div className="flex min-h-screen flex-wrap items-center justify-center gap-4 bg-ink pt-24">
      <style>{`
        .pin-frame [class^="pose-"], .pin-frame [class*=" pose-"] { opacity: 0 !important; }
        ${PINS.map(
          (p, i) =>
            `.pin-${i} ${p.show
              .split(" ")
              .map((c) => `.${c}`)
              .join(", .pin-" + i + " ")} { opacity: 1 !important; }`
        ).join("\n")}
        .pin-frame .pose-monogram path { stroke-dashoffset: 0 !important; stroke-dasharray: none !important; }
      `}</style>
      {PINS.map((p, i) => (
        <div key={p.phase} className={`pin-frame pin-${i} rounded-xl border border-line p-6 text-center`}>
          <HandScene phase={p.phase} />
          <p className="mono-label mt-4">{p.phase}</p>
        </div>
      ))}
    </div>
  );
}
