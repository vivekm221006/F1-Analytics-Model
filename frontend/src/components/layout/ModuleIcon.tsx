import { SystemModule } from "@/lib/tokens";

type IconProps = { name: SystemModule["icon"] };

export function ModuleIcon({ name }: IconProps) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.5,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "predictor":
      return (
        <svg {...common}>
          <path
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pit":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7V12L15 14" strokeLinecap="round" />
        </svg>
      );
    case "simulator":
      return (
        <svg {...common}>
          <path
            d="M4 19L9 11L13 15L20 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "optimizer":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "shap":
      return (
        <svg {...common}>
          <path
            d="M3 12H7L9 6L14 18L16 12H21"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "engine":
      return (
        <svg {...common}>
          <path
            d="M12 2L4 6V12C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 12V6L12 2Z"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
