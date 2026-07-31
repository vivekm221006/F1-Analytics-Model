"use client";

import { ReactNode } from "react";
import { useIntroAnimation } from "@/lib/useIntroAnimation";

export function AnimationProvider({ children }: { children: ReactNode }) {
  useIntroAnimation();
  return <>{children}</>;
}
