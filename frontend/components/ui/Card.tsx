import { HTMLAttributes } from "react";

export default function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface border border-ink/10 rounded-lg shadow-sm ${className}`}
      {...props}
    />
  );
}
