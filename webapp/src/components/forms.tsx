"use client";

import { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputBase} resize-y ${props.className ?? ""}`} />;
}

export function YesNo({
  value,
  onChange,
  labels = ["Sim", "Não"],
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  labels?: [string, string];
}) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
            value === v
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface text-ink hover:border-accent/50"
          }`}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  );
}

export function ChoiceGroup({
  options,
  value,
  onChange,
  columns = 1,
}: {
  options: { value: string | number; label: string }[];
  value: string | number | null;
  onChange: (v: any) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium text-left transition ${
            value === opt.value
              ? "border-accent bg-accent-soft text-accent-dark"
              : "border-border bg-surface text-ink hover:border-accent/50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function CheckboxGroup({
  options,
  values,
  onChange,
  columns = 2,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  columns?: number;
}) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium text-left transition ${
            values.includes(opt)
              ? "border-accent bg-accent-soft text-accent-dark"
              : "border-border bg-surface text-ink hover:border-accent/50"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  min,
  max,
  value,
  onChange,
  labelMin,
  labelMax,
}: {
  min: number;
  max: number;
  value: number | null;
  onChange: (v: number) => void;
  labelMin: string;
  labelMax: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value ?? Math.round((min + max) / 2)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <span className="font-mono text-lg font-semibold text-accent-dark w-10 text-center tabular-nums">
          {value ?? "–"}
        </span>
      </div>
      <div className="flex justify-between text-xs text-muted mt-1">
        <span>{labelMin}</span>
        <span>{labelMax}</span>
      </div>
    </div>
  );
}

export function LikertItem({
  texto,
  numero,
  total,
  opcoes,
  value,
  onChange,
}: {
  texto: string;
  numero: number;
  total: number;
  opcoes: string[];
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="border-b border-border py-4 last:border-0">
      <p className="text-sm text-ink mb-3">
        <span className="font-mono text-muted mr-2">
          {numero}/{total}
        </span>
        {texto}
      </p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}>
        {opcoes.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`rounded-lg border px-2 py-2.5 text-xs sm:text-sm font-medium transition ${
              value === i
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface text-ink hover:border-accent/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {subtitle && <p className="text-muted mt-1 text-[15px]">{subtitle}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function AlertBanner({ nivel, children }: { nivel: 1 | 2 | 3 | 4; children: ReactNode }) {
  const styles: Record<number, string> = {
    1: "bg-info-soft border-info/30 text-info",
    2: "bg-warn-soft border-warn/30 text-warn",
    3: "bg-warn-soft border-warn/40 text-warn",
    4: "bg-danger-soft border-danger/30 text-danger",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles[nivel]}`}>{children}</div>
  );
}
