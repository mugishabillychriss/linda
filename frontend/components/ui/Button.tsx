import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export default function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "px-5 py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-signal text-white hover:bg-signal-dark",
    secondary: "bg-transparent border border-ink/15 text-ink hover:bg-ink/5",
    ghost: "bg-transparent text-slate hover:text-ink",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
