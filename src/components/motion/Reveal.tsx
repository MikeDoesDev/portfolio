import type { ReactNode } from "react";
/** Content remains visible before hydration and with JavaScript disabled. */
export default function Reveal({ children, className }: { children: ReactNode; delay?: number; className?: string }) { return <div className={className}>{children}</div>; }
