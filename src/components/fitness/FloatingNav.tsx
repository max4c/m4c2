"use client";
import { useEffect, useState } from "react";
const items = [
  {
    id: "overview",
    label: "Today",
    path: "M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9",
  },
  { id: "weekly", label: "Week", path: "M5 20V12m7 8V5m7 15v-9" },
  {
    id: "training",
    label: "Training",
    path: "M6 5v14M3 8v8m15-11v14m3-11v8M6 12h12",
  },
  { id: "trends", label: "Trends", path: "m3 17 6-6 4 3 8-10M15 4h6v6" },
  {
    id: "history",
    label: "Meals",
    path: "M4 3v6a3 3 0 0 0 6 0V3M7 3v18M19 3c-3 2-4 6-4 10h4m0-10v18",
  },
];
export default function FloatingNav() {
  const [active, setActive] = useState("overview");
  useEffect(() => {
    const update = () => {
      let current = "overview";
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4)
          current = item.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <nav className="floating-dock" aria-label="Supermedium navigation">
      {items.map((item) => (
        <a
          key={item.id}
          href={"#" + item.id}
          aria-label={item.label}
          title={item.label}
          aria-current={active === item.id ? "location" : undefined}
          onClick={() => setActive(item.id)}
        >
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
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
