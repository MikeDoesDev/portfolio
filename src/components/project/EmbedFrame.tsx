"use client";

import { useRef, useState } from "react";
import { useInView } from "motion/react";

interface EmbedFrameProps {
  src: string;
  title: string;
  /** Aspect ratio as `width / height`, e.g. 16 / 10. */
  aspect?: number;
}

/**
 * Lazy iframe: mounts the embed only when scrolled near the viewport,
 * with a fullscreen button. Used for self-contained demos in /public/demos.
 */
export default function EmbedFrame({ src, title, aspect = 16 / 10 }: EmbedFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const inView = useInView(wrapRef, { margin: "40% 0px" });
  const [loaded, setLoaded] = useState(false);

  return (
    /* The demos are self-contained dark pages. On a cream ground a bare dark
       rectangle reads as a hole in the paper, so it gets a lip of raised tan
       around it and it reads as a screen instead. */
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-xl border-8 border-raised bg-[#1e1a14] shadow-[0_18px_40px_-22px_rgba(51,41,31,0.45)]"
      style={{ aspectRatio: aspect }}
    >
      {inView ? (
        <>
          <iframe
            ref={frameRef}
            src={src}
            title={title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className="h-full w-full"
          />
          <button
            type="button"
            onClick={() => frameRef.current?.requestFullscreen?.()}
            className="absolute right-3 top-3 rounded-md border border-line bg-ink/80 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted backdrop-blur transition-colors hover:text-fg"
          >
            Fullscreen
          </button>
          {!loaded && (
            <p className="absolute inset-0 flex items-center justify-center font-mono text-sm text-[#a79c8c]">
              Loading demo…
            </p>
          )}
        </>
      ) : (
        <p className="absolute inset-0 flex items-center justify-center font-mono text-sm text-[#a79c8c]">
          Demo loads when visible
        </p>
      )}
    </div>
  );
}
