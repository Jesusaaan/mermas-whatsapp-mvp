"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./ui/icons";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/inventario", label: "Inventario", icon: "box" },
  { href: "/movimientos", label: "Movimientos", icon: "swap" },
  { href: "/alertas", label: "Alertas", icon: "bell" },
  { href: "/configuracion", label: "Configuración", icon: "settings" },
];

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-sage-800 text-sm font-semibold text-sage-50">M</span>
      <span className="text-[15px] font-semibold tracking-tight text-ink">Mermas</span>
    </span>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-sage-100 text-sage-900" : "text-muted hover:bg-sunken hover:text-ink"
            }`}
          >
            <Icon name={item.icon} className={`size-[18px] ${active ? "text-sage-700" : "text-subtle"}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ negocio, children }: { negocio: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sidebarFooter = (
    <div className="rounded-lg border border-line bg-sunken p-3">
      <p className="text-xs font-medium text-ink">{negocio}</p>
      <p className="mt-0.5 text-xs text-muted">Negocio de demostración</p>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col justify-between border-r border-line bg-surface px-3 py-4 lg:flex">
        <div>
          <div className="px-3 pb-5 pt-1"><Logo /></div>
          <NavLinks pathname={pathname} />
        </div>
        {sidebarFooter}
      </aside>

      {/* Cajón móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col justify-between bg-surface px-3 py-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between px-3 pb-5 pt-1">
                <Logo />
                <button
                  type="button"
                  aria-label="Cerrar menú"
                  onClick={() => setOpen(false)}
                  className="grid size-8 place-items-center rounded-lg text-muted hover:bg-sunken"
                >
                  <Icon name="close" className="size-5" />
                </button>
              </div>
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            {sidebarFooter}
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20">
        <div
          role="status"
          className="flex items-center justify-center gap-2 border-b border-amber-ink/15 bg-amber-soft px-4 py-1.5 text-xs font-medium text-amber-ink"
        >
          <span className="size-1.5 rounded-full bg-amber-ink" />
          Modo demostración — datos simulados
        </div>
        <div className="flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
          <Logo />
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-ink"
          >
            <Icon name="menu" className="size-5" />
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
