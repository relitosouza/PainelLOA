import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: string;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      loading = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-1.5 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-xl";

    const variantStyles = {
      primary: "bg-primary text-on-primary hover:opacity-90 shadow-xs active:scale-[0.98]",
      secondary: "bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-[0.98]",
      outline: "border border-outline-variant bg-surface text-on-surface hover:bg-surface-container/60 active:scale-[0.98]",
      danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-xs active:scale-[0.98]",
      ghost: "text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 min-h-[32px]",
      md: "text-xs px-3.5 py-2 min-h-[38px]",
      lg: "text-sm px-5 py-2.5 min-h-[44px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
        ) : icon ? (
          <span className="material-symbols-outlined text-sm shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
