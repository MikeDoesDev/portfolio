"use client";

import { motion, useScroll } from "motion/react";

// Thin sage bar across the top of the window that fills as the page scrolls
// and is full at the bottom. It follows the scroll position directly, with no
// easing, so it never lags behind the page and needs no reduced-motion case.
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div aria-hidden="true" className="scroll-progress" style={{ scaleX: scrollYProgress }} />;
}
