"use client";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
export type DashboardView =
  "today" | "history" | "trends" | "goals" | "routine" | "timer" | "settings";
const items = [
  {
    id: "today",
    label: "Home",
    path: "M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9",
  },
  {
    id: "timer",
    label: "Timer",
    path: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 7v5l3 2",
  },
  {
    id: "history",
    label: "History",
    path: "M4 5h16v16H4zM8 3v4m8-4v4M4 11h16m-12 4h2m4 0h2",
  },
  { id: "trends", label: "Trends", path: "m3 17 6-6 4 3 8-10M15 4h6v6" },
  {
    id: "settings",
    label: "Settings",
    path: "",
  },
];
export default function FloatingNav({ active }: { active: DashboardView }) {
  return (
    <nav className="floating-dock" aria-label="Supermedium navigation">
      {items.map((item) => (
        <a
          key={item.id}
          href={"#" + item.id}
          aria-label={item.label}
          aria-current={
            active === item.id ||
            ((active === "routine" || active === "goals") &&
              item.id === "settings")
              ? "page"
              : undefined
          }
        >
          {item.id === "settings" ? (
            <Cog6ToothIcon aria-hidden="true" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.65"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={item.path} />
            </svg>
          )}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
