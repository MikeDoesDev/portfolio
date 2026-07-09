import type { Metadata } from "next";
import ProjectLayout from "@/components/project/ProjectLayout";
import EmbedFrame from "@/components/project/EmbedFrame";
import Reveal from "@/components/motion/Reveal";
import { getProject } from "@/content/projects";

export const metadata: Metadata = {
  title: "Raspberry Pi 5 — 3D Blueprint",
  description:
    "An interactive Raspberry Pi 5 rendered in the browser: fully procedural Three.js geometry, 23 clickable components, and a glowing wireframe blueprint mode.",
};

const metrics = [
  { value: "23", label: "individually clickable components" },
  { value: "100%", label: "procedural geometry — zero model downloads" },
  { value: "~26 ms", label: "full-quality frame render" },
];

export default function RaspberryPi3DPage() {
  return (
    <ProjectLayout
      project={getProject("raspberry-pi-3d")}
      role="I built this solo, with every piece of geometry generated procedurally — each chip, port, and trace on the board is modeled in code, not downloaded as an asset."
    >
      <Reveal>
        <section className="max-w-2xl">
          <h2 className="mono-label mb-4 text-copper">Overview</h2>
          <div className="space-y-4 text-muted">
            <p>
              This is an interactive 3D Raspberry Pi 5 that runs entirely in the browser.
              The whole board — BCM2712 SoC, LPDDR4X RAM, GPIO header, USB stack,
              Ethernet jack, and everything between — is procedural Three.js geometry
              with PBR materials and a canvas-textured silkscreen. No 3D model files were
              downloaded; if it&rsquo;s on the board, I wrote the code that shapes it.
            </p>
            <p>
              Hover any of the 23 components and it highlights with a label. Click it and
              a detail panel opens: what the part does, its key specs, and a fun fact —
              all verified against official Raspberry Pi documentation. A toggle flips
              the whole scene between realistic mode and a glowing wireframe
              &ldquo;blueprint mode&rdquo;, with auto-rotate, reset view, and a labels toggle
              alongside.
            </p>
            <p className="text-fg">
              I built it as a learning artifact: the fastest way I know to internalize
              single-board-computer architecture is to model every part of one, then have
              to explain each part in a click panel.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <EmbedFrame
            src="/demos/raspberry-pi-3d/index.html"
            title="Interactive Raspberry Pi 5 3D blueprint"
            aspect={16 / 10}
          />
          <p className="mt-3 font-mono text-xs text-muted">
            How to drive it — orbit: drag · zoom: scroll · inspect: click a component.
            The demo loads Three.js from a CDN, so it needs a network connection.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <h2 className="mono-label mb-6 text-copper">Highlights</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">Procedural geometry</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Downloading a board model would have made this a viewer; building the
                geometry myself made it a study. Every chip is a placed, sized, and
                textured decision, which forced me to learn what actually sits on a Pi 5
                and why. It also keeps the payload tiny — the scene is code, not megabytes
                of mesh data.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">Blueprint mode</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                One toggle swaps PBR realism for a glowing wireframe schematic look. It&rsquo;s
                more than a visual trick: stripping the materials away makes the board&rsquo;s
                structure legible — you see component placement and relative scale the way
                a layout engineer would, not the way a product photo shows it.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">Verified component facts</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Each of the 23 detail panels — what the component does, key specs, one fun
                fact — was checked against official Raspberry Pi documentation before it
                shipped. A learning artifact that teaches wrong facts is worse than none,
                so verification was part of the build, not an afterthought.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="border-y border-line py-10">
          <div className="grid gap-10 sm:grid-cols-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="font-heading text-4xl font-bold text-copper sm:text-5xl">{m.value}</p>
                <p className="mono-label mt-3">{m.label}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="max-w-2xl">
          <h2 className="mono-label mb-4 text-copper">What&rsquo;s next</h2>
          <p className="text-muted">
            The renderer is clean — zero console errors, full-quality frames in about
            26&nbsp;ms — so the interesting work left is depth, not polish: an exploded
            view that lifts components off the PCB, and tracing real signal paths between
            them so blueprint mode explains connections, not just parts.
          </p>
        </section>
      </Reveal>
    </ProjectLayout>
  );
}
