"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";
import type { WardrobeItem } from "../../../shared/wardrobe";

type Week = FunctionReturnType<typeof api.wardrobe.latestWeek>;

export function ClosetNavigation({ outfits = false }: { outfits?: boolean }) {
  return (
    <nav className="w-closet-nav" aria-label="Wardrobe">
      <a href="#" aria-current={!outfits ? "page" : undefined}>Closet</a>
      <a href="#outfits" aria-current={outfits ? "page" : undefined}>Outfits</a>
    </nav>
  );
}

function dayOfWeek(monday: string, offset: number) {
  const day = new Date(monday + "T12:00:00Z");
  day.setUTCDate(day.getUTCDate() + offset);
  return day;
}

export function WeeklyOutfits({ items, name }: { items: WardrobeItem[]; name: string }) {
  const [week, setWeek] = useState<Week | undefined>(undefined);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/wardrobe/api/outfits", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data: Week = await response.json();
        if (!controller.signal.aborted) setWeek(data);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);
  if (error) return <div role="alert">Couldn’t load your outfits. <button className="w-edit" onClick={() => { setError(false); retry(attempt + 1); }}>Try again</button></div>;
  if (week === undefined) return <p role="status">Loading outfits…</p>;
  if (!week) return <section className="w-empty"><h1>Weekly outfits</h1><p>Your first week will appear here.</p></section>;
  const start = dayOfWeek(week.weekOf, 0);
  const end = dayOfWeek(week.weekOf, 4);
  const dateRange = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).formatRange(start, end);
  return (
    <section>
      <header className="w-week-header">
        <h1>{dateRange}</h1>
        <p>{week.city} · {start.getUTCFullYear()} · Five weekday outfits</p>
      </header>
      <div className="w-look-grid">
        {week.looks.map((look, index) => {
          const day = dayOfWeek(week.weekOf, index);
          const weekday = day.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
          return <article key={index} className="w-look">
            <h2>{weekday} <span>{day.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span></h2>
            <img src={`/wardrobe/api/outfit-image/${week._id}/${index}`} alt={`${name} wearing ${look.title.toLowerCase()}`} width="900" height="1350" />
            <h3>{look.title}</h3>
            <p className="w-weather"><strong>{look.high}°F</strong> high · {look.nightLow}°F overnight<br />{look.weather}</p>
            <p className="w-reason">{look.why}</p>
            <ul aria-label={`${weekday} closet items`}>{look.items.map(id => {
              const item = items.find(piece => piece._id === id);
              return item ? <li key={id}><a href={`#${id}`}>{item.name}</a></li> : null;
            })}</ul>
          </article>;
        })}
      </div>
      <footer className="w-outfit-source">Forecast from the <a href={week.forecastUrl}>National Weather Service</a>, issued {new Date(week.forecastIssued).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: "America/Los_Angeles" })}.</footer>
    </section>
  );
}
