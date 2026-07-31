"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a small glowing dot that tracks the mouse exactly, plus a
 * larger ring that eases toward it with spring-like lag. Any element
 * with [data-cursor-hover] expands the ring and tints it solid cyan.
 *
 * Disabled automatically on touch devices via the (hover: none) guard
 * in globals.css, which restores the system cursor.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId: number;

    const handleMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    };

    const loop = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      rafId = requestAnimationFrame(loop);
    };

    const handleOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        "[data-cursor-hover]"
      );
      ring.classList.toggle("cursor-hover", Boolean(target));
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseover", handleOver);
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_8px_#00E5C9] hidden md:block"
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="cursor-ring pointer-events-none fixed top-0 left-0 z-[9999] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/50 transition-[width,height,border-color,background] duration-[250ms] ease-[cubic-bezier(.16,1,.3,1)] hidden md:block"
      />
      <style jsx global>{`
        .cursor-ring.cursor-hover {
          width: 56px;
          height: 56px;
          border-color: #00e5c9;
          background: rgba(0, 229, 201, 0.06);
        }
      `}</style>
    </>
  );
}
