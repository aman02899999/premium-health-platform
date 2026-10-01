import type { ElementType, ReactNode } from "react";

// Fades/slides children in as they scroll into view — pure CSS (scroll-driven
// animations, see .reveal in globals.css). Content is visible from the first
// paint and never waits for JavaScript, so it can't delay LCP; browsers without
// scroll-timeline support simply show it without the animation.
export function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  /** Kept for compatibility; scroll-driven reveals are timed by scroll position. */
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={`reveal ${className}`}>{children}</Tag>;
}
