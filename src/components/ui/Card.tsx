import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  elevated?: boolean;
}

export function Card({ children, className = "", hover = false, elevated = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-border ${
        elevated
          ? "shadow-md"
          : "shadow-sm"
      } ${
        hover
          ? "hover:shadow-md hover:border-border-strong transition-all duration-200 cursor-pointer"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-border-subtle ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
