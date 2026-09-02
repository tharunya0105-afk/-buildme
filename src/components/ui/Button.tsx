import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary:
      "bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-sm",
    accent:
      "bg-accent text-white hover:bg-accent-dark focus:ring-accent shadow-sm",
    secondary:
      "bg-white text-text-primary border border-border hover:bg-surface-alt hover:border-border-strong focus:ring-accent",
    danger:
      "bg-danger text-white hover:bg-danger-dark focus:ring-danger shadow-sm",
    ghost:
      "text-text-secondary hover:text-text-primary hover:bg-surface-alt focus:ring-accent",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
