import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function ButtonPrimary({
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      data-cursor-hover
      className={clsx(
        "group inline-flex items-center gap-2.5 rounded-lg bg-cyan px-8 py-4",
        "text-[13px] font-semibold tracking-[0.04em] text-void",
        "transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(.16,1,.3,1)]",
        "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,229,201,0.28)]",
        className
      )}
      {...props}
    >
      {children}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
        className="transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1"
      >
        <path
          d="M3 7H11M11 7L7 3M11 7L7 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function ButtonGhost({ children, className, ...props }: ButtonProps) {
  return (
    <button
      data-cursor-hover
      className={clsx(
        "rounded-lg border border-line-strong bg-transparent px-7 py-4",
        "text-[13px] font-medium text-ink-hi",
        "transition-[border-color,background] duration-300",
        "hover:border-cyan hover:bg-cyan/[0.04]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
