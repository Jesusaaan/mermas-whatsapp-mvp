import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export type Tone = "neutral" | "sage" | "amber" | "clay" | "sky";

const BADGE: Record<Tone, string> = {
  neutral: "bg-sunken text-muted ring-line",
  sage: "bg-sage-50 text-sage-700 ring-sage-200",
  amber: "bg-amber-soft text-amber-ink ring-amber-ink/15",
  clay: "bg-clay-soft text-clay-ink ring-clay-ink/15",
  sky: "bg-sky-soft text-sky-ink ring-sky-ink/15",
};

const DOT: Record<Tone, string> = {
  neutral: "bg-subtle",
  sage: "bg-sage-500",
  amber: "bg-amber-ink",
  clay: "bg-clay-ink",
  sky: "bg-sky-ink",
};

export function Badge({ tone = "neutral", dot = true, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[tone]}`}
    >
      {dot && <span className={`size-1.5 rounded-full ${DOT[tone]}`} />}
      {children}
    </span>
  );
}

export function PageHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
      </div>
      {children}
    </header>
  );
}

export function Card({ title, subtitle, action, children, className = "" }: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface shadow-[0_1px_0_rgba(29,36,32,0.03)] ${className}`}>
      {title && (
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon, tone = "sage" }: {
  label: string;
  value: string;
  hint: string;
  icon: IconName;
  tone?: Tone;
}) {
  return (
    <div className="group rounded-xl border border-line bg-surface p-5 shadow-[0_1px_0_rgba(29,36,32,0.03)] transition hover:border-line-strong hover:shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className={`grid size-8 place-items-center rounded-lg ring-1 ring-inset ${BADGE[tone]}`}>
          <Icon name={icon} className="size-4" />
        </span>
      </div>
      <p className="tabular mt-3 text-[1.75rem] font-semibold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}

export function EmptyState({ icon = "search", title, description, action }: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-sunken text-subtle">
        <Icon name={icon} className="size-5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Chips<T extends string>({ value, onChange, options, label }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-sunken p-0.5 ring-1 ring-inset ring-line">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            value === o.value ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const inputClass =
  "h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-subtle transition hover:border-line-strong focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200";

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block min-w-0 flex-1 sm:max-w-xs">
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-8`}
      />
    </label>
  );
}
