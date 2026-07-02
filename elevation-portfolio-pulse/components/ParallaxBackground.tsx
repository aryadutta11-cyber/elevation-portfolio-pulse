'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';

/**
 * Fixed, multi-layer parallax backdrop. Each layer translates at a
 * different rate as the page scrolls, giving the glowing orbs and the
 * faint grid a sense of depth behind the glass cards.
 */
export function ParallaxBackground() {
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();

  // Smooth the raw scroll value so layers glide instead of tracking 1:1.
  const smooth = useSpring(scrollY, { stiffness: 90, damping: 28, mass: 0.6 });

  const yFar = useTransform(smooth, [0, 1200], [0, reduceMotion ? 0 : 90]);
  const yMid = useTransform(smooth, [0, 1200], [0, reduceMotion ? 0 : 220]);
  const yNear = useTransform(smooth, [0, 1200], [0, reduceMotion ? 0 : -170]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-ec-navy via-ec-navy-deep to-black"
    >
      {/* Far layer: aurora wash at the top + blueprint grid */}
      <motion.div style={{ y: yFar }} className="absolute inset-0">
        <div
          className="absolute -top-40 left-1/2 h-[34rem] w-[72rem] -translate-x-1/2 rounded-[100%] opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(50,131,255,0.16) 0%, rgba(50,131,255,0.05) 45%, transparent 70%)',
          }}
        />
        <div className="bg-grid-faint absolute inset-0" />
      </motion.div>

      {/* Mid layer: large drifting orbs */}
      <motion.div style={{ y: yMid }} className="absolute inset-0">
        <div className="absolute left-[12%] top-[28%] h-[26rem] w-[26rem] rounded-full bg-ec-blue/12 blur-3xl" />
        <div className="absolute right-[8%] top-[62%] h-[20rem] w-[20rem] rounded-full bg-ec-glass-2/10 blur-3xl" />
      </motion.div>

      {/* Near layer: smaller, brighter accents moving against the scroll */}
      <motion.div style={{ y: yNear }} className="absolute inset-0">
        <div className="absolute right-[24%] top-[18%] h-40 w-40 rounded-full bg-ec-blue/15 blur-2xl" />
        <div className="absolute bottom-[8%] left-[30%] h-56 w-56 rounded-full bg-ec-glass-1/8 blur-3xl" />
      </motion.div>

      {/* Vignette to keep edges dark and cards legible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 90% at 50% 40%, transparent 55%, rgba(5,10,18,0.55) 100%)',
        }}
      />
    </div>
  );
}
