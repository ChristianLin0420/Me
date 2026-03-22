import React from 'react';
import { cn } from '@/src/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'text';
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-dim",
    outline: "border-b border-on-surface hover:text-tertiary hover:border-tertiary",
    text: "font-mono underline decoration-1 underline-offset-4 hover:text-primary"
  };

  return (
    <button
      className={cn(
        "px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all active:scale-95",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SectionHeader({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn("mb-16", className)}>
      <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter mb-4">{title}</h2>
      {subtitle && <p className="mono-text text-sm text-on-surface-variant opacity-60">{subtitle}</p>}
    </div>
  );
}
