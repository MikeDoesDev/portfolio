import type { ReactNode } from "react";

interface MediaFrameProps {
  caption?: string;
  /** Screenshot <Image>, inline SVG diagram, iframe, or placeholder content. */
  children: ReactNode;
  className?: string;
}

/** Bordered dark frame that gives every visual a consistent presentation. */
export default function MediaFrame({ caption, children, className = "" }: MediaFrameProps) {
  return (
    <figure className={`overflow-hidden rounded-xl border border-line bg-surface ${className}`}>
      <div className="[&>img]:w-full [&>svg]:w-full">{children}</div>
      {caption && (
        <figcaption className="border-t border-line px-4 py-3 font-mono text-xs text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
