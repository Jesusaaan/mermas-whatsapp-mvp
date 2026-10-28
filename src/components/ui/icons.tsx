import type { SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "box"
  | "swap"
  | "bell"
  | "settings"
  | "menu"
  | "close"
  | "search"
  | "trash"
  | "cart"
  | "list"
  | "whatsapp"
  | "alert"
  | "check";

const PATHS: Record<IconName, string> = {
  dashboard: "M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z",
  box: "M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5 12 12m0 0 8.5-4.5M12 12v9",
  swap: "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4m4 4H7",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4",
  settings: "M4 7h9m4 0h3M4 17h3m4 0h9M15 4v6M9 14v6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  search: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm5-2 4.5 4.5",
  trash: "M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13",
  cart: "M3 4h2.5l2 11h10.5l2-8H6.5M9 20h.01M17 20h.01",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  whatsapp: "M4 20l1.3-4.2A8 8 0 1 1 8.3 18.8zM9 9.5c.5 2.5 2.5 4.5 5 5.5l1.2-1.2-1.8-1-.8.7c-.8-.4-1.6-1.2-2-2l.7-.8-1-1.8z",
  alert: "M12 4 2.5 20h19zM12 10v4.5M12 17.5h.01",
  check: "M5 12.5 10 17.5 19 7",
};

export function Icon({ name, className = "size-5", ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
