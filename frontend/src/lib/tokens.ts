/**
 * F1 Control Room — Design Tokens
 *
 * Single source of truth for the visual language. Components should
 * import from here rather than hardcoding hex values, so the whole
 * system can be retuned from one place.
 */

export const colors = {
  void: "#05060A",
  panel: "#0B0E16",
  panel2: "#10141F",
  cyan: "#00E5C9",
  cyanDim: "#00897A",
  red: "#FF2D55",
  ink: {
    hi: "#E8EAED",
    mid: "#9298A6",
    lo: "#5B6270",
  },
  line: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.14)",
} as const;

export const colorsThree = {
  cyan: 0x00e5c9,
  red: 0xff2d55,
  void: 0x05060a,
  particle: 0x4a5568,
} as const;

export const motion = {
  durations: {
    fast: 0.25,
    base: 0.4,
    slow: 0.9,
    hero: 1.1,
  },
  ease: {
    out: "power3.out",
    expo: "expo.out",
  },
} as const;

export const typography = {
  display: "var(--font-inter)",
  mono: "var(--font-jetbrains)",
} as const;

export type SystemModule = {
  id: string;
  tag: string;
  title: string;
  description: string;
  icon: "predictor" | "pit" | "simulator" | "optimizer" | "shap" | "engine";
};

/**
 * The six system modules shown in the module grid. Keep this data
 * here (not hardcoded in the component) so updating copy doesn't
 * require touching layout code.
 */
export const systemModules: SystemModule[] = [
  {
    id: "lap-predictor",
    tag: "01",
    title: "Lap time predictor",
    description:
      "Forecasts next-lap pace from tyre age, traffic, fuel load, and circuit profile — accurate to within 1.25 seconds.",
    icon: "predictor",
  },
  {
    id: "pit-strategy",
    tag: "02",
    title: "Pit strategy advisor",
    description:
      "Compound-aware recommendations — soft, medium, hard, wet — weighing degradation against track position in real time.",
    icon: "pit",
  },
  {
    id: "race-simulator",
    tag: "03",
    title: "Race simulator",
    description:
      "Runs the full remaining race lap-by-lap, projecting finishing order against the actual historical result.",
    icon: "simulator",
  },
  {
    id: "strategy-optimizer",
    tag: "04",
    title: "Strategy optimiser",
    description:
      "Compares eight pit-window scenarios per driver, every lap, to surface the single fastest path to the flag.",
    icon: "optimizer",
  },
  {
    id: "explainability",
    tag: "05",
    title: "Explainability layer",
    description:
      "Every prediction ships with a SHAP breakdown — exactly which signal moved the model, and by how much.",
    icon: "shap",
  },
];

export type HeroStat = { value: string; unit: string; label: string };

export const heroStats: HeroStat[] = [
  { value: "2009", unit: "—24", label: "Seasons of telemetry" },
  { value: "20", unit: "drivers", label: "Optimised simultaneously" },
  { value: "0.98", unit: "auc", label: "Pit decision accuracy" },
  { value: "8", unit: "scenarios", label: "Per-driver strategy windows" },
];

export type HudMetric = {
  label: string;
  status: "live" | "active";
  rows: { key: string; value: string; barPct?: number }[];
};

export const hudMetrics: HudMetric[] = [
  {
    label: "Lap prediction",
    status: "live",
    rows: [
      { key: "Model accuracy", value: "R² 0.753", barPct: 75.3 },
      { key: "Mean error", value: "1.25s" },
    ],
  },
  {
    label: "Pit strategy",
    status: "active",
    rows: [
      { key: "ROC AUC", value: "0.981", barPct: 98.1 },
      { key: "Scenarios / driver", value: "8" },
    ],
  },
];
