"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * Runs once on mount:
 *  1. A single orchestrated GSAP timeline animates the nav, headline,
 *     sub copy, CTAs, HUD panel, and scroll cue into place — one
 *     deliberate sequence rather than scattered independent effects.
 *  2. An IntersectionObserver watches every [data-reveal] element
 *     below the fold and fades/slides it in the first time it enters
 *     the viewport, then stops observing it (no replay on scroll-up).
 *
 * Respects prefers-reduced-motion by skipping straight to the end
 * state instead of animating.
 */
export function useIntroAnimation() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const introTargets = [
      "#nav",
      "#eyebrow",
      "#headline-1",
      "#headline-2",
      "#hero-sub",
      "#hero-cta",
      "#hud",
      "#scroll-cue",
    ];

    if (prefersReducedMotion) {
      gsap.set(introTargets, { opacity: 1, y: 0, clearProps: "transform" });
    } else {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to("#nav", { opacity: 1, y: 0, duration: 0.9, delay: 0.3 })
        .to("#eyebrow", { opacity: 1, duration: 0.7 }, "-=0.5")
        .to(
          "#headline-1",
          { y: "0%", duration: 1.1, ease: "expo.out" },
          "-=0.3"
        )
        .to(
          "#headline-2",
          { y: "0%", duration: 1.1, ease: "expo.out" },
          "-=0.85"
        )
        .to("#hero-sub", { opacity: 1, duration: 0.8 }, "-=0.6")
        .to("#hero-cta", { opacity: 1, duration: 0.8 }, "-=0.55")
        .to("#hud", { opacity: 1, duration: 1 }, "-=0.7")
        .to("#scroll-cue", { opacity: 1, duration: 0.6 }, "-=0.3");
    }

    const revealEls = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (prefersReducedMotion) {
      revealEls.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
            });
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);
}
