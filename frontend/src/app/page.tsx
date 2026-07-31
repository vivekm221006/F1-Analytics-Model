import { TelemetryScene } from "@/components/scene/TelemetryScene";
import { SceneOverlay } from "@/components/scene/SceneOverlay";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { Nav } from "@/components/layout/Nav";
import { Hero } from "@/components/layout/Hero";
import { StatStrip } from "@/components/layout/StatStrip";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { Footer } from "@/components/layout/Footer";
import { AnimationProvider } from "@/components/layout/AnimationProvider";

export default function HomePage() {
  return (
    <AnimationProvider>
      <CustomCursor />
      <TelemetryScene />
      <SceneOverlay />

      <Nav />
      <Hero />
      <StatStrip />
      <ModuleGrid />
      <Footer />
    </AnimationProvider>
  );
}
