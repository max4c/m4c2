"use client";
/* eslint-disable @next/next/no-img-element */
import {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useId,
  useRef,
} from "react";
import {
  categories,
  colors,
  materials,
  metadataSchema,
  selectItems,
  type Filters,
  type ItemMetadata,
  type WardrobeItem,
  type WardrobeView,
} from "../../../shared/wardrobe";

import { ClosetNavigation, WeeklyOutfits } from "./WeeklyOutfits";

type Catalogue = { owner: string; name: string; items: WardrobeItem[] };
const initialFilters: Filters = {
  search: "",
  category: "",
  color: "",
  material: "",
  sort: "category",
};
const labels: Record<WardrobeView, string> = {
  front: "Front",
  side: "Side",
  back: "Back",
  detail: "Detail",
  source: "Original frame",
};
const imageUrl = (item: WardrobeItem, view: WardrobeView) =>
  `/wardrobe/api/image/${item._id}/${view}`;
const primaryView = (item: WardrobeItem) =>
  item.views.find((view) => view !== "source");

const colorSwatches: Record<ItemMetadata["color"], string> = {
  Black: "#202020",
  White: "#ffffff",
  Grey: "#999999",
  Cream: "#f1ead8",
  Beige: "#d3bd98",
  Brown: "#805a3c",
  Blue: "#6697cf",
  Navy: "#26354f",
  Green: "#72915c",
  Red: "#c8524b",
  Pink: "#e8a4ba",
  Purple: "#9a7ab5",
  Yellow: "#e7c956",
  Orange: "#dd944e",
  Silver: "#c4c8cc",
  Gold: "#c8aa50",
  Multicolor:
    "conic-gradient(#c8524b, #e7c956, #72915c, #6697cf, #9a7ab5, #c8524b)",
  Unknown: "linear-gradient(135deg, #fff 46%, #bbb 47%, #bbb 53%, #fff 54%)",
};

function ColorFilter({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ItemMetadata["color"][];
  onChange: (value: string) => void;
}) {
  const id = useId();
  const picker = useRef<HTMLDetailsElement>(null);
  const swatch = (color: string) => (
    <span
      className="w-color-swatch"
      aria-hidden="true"
      style={{
        background: color
          ? colorSwatches[color as ItemMetadata["color"]]
          : "#fff",
      }}
    />
  );
  function close() {
    if (picker.current) picker.current.open = false;
    picker.current?.querySelector("summary")?.focus();
  }
  return (
    <div className="w-color-field">
      <span id={`${id}-label`}>Color</span>
      <details
        className="w-color-picker"
        ref={picker}
        onKeyDown={(event) => {
          if (event.key === "Escape" && picker.current?.open) {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
      >
        <summary aria-labelledby={`${id}-label ${id}-value`}>
          {swatch(value)}
          <span id={`${id}-value`}>{value || "All colors"}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </summary>
        <div
          className="w-color-options"
          role="radiogroup"
          aria-labelledby={`${id}-label`}
        >
          {["", ...options].map((color) => (
            <label className="w-color-option" key={color}>
              <input
                type="radio"
                name={id}
                value={color}
                checked={value === color}
                onChange={() => {
                  onChange(color);
                  close();
                }}
              />
              {swatch(color)}
              <span>{color || "All colors"}</span>
              {value === color && (
                <span className="w-color-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}

async function request(path: string, body?: unknown) {
  const response = await fetch(`/wardrobe/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}
function Hanger() {
  return (
    <svg viewBox="0 0 80 70" fill="none" aria-hidden="true">
      <path
        d="M30 20c0-15 22-15 22-2 0 9-12 9-12 19L72 58c4 3 2 8-3 8H11c-5 0-7-5-3-8l32-21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ItemImage({
  item,
  view,
  eager = false,
  tile = false,
}: {
  item: WardrobeItem;
  view?: WardrobeView;
  eager?: boolean;
  tile?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return view && !failed ? (
    <img
      src={imageUrl(item, view) + (tile ? "?size=tile" : "")}
      alt={`${item.name}, ${labels[view].toLowerCase()} view`}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="w-image-missing">
      <Hanger />
      <span>{view ? "Image unavailable" : "Image coming soon"}</span>
    </div>
  );
}
function AccountMenu({ onLogout }: { onLogout: () => Promise<void> }) {
  return (
    <>
      <button
        className="w-icon-button"
        popoverTarget="wardrobe-account"
        aria-label="Account"
        title="Account"
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" strokeLinecap="round" />
        </svg>
      </button>
      <div
        id="wardrobe-account"
        className="w-popover w-account-menu"
        popover="auto"
        role="group"
        aria-label="Account"
      >
        <button className="w-account-action" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </>
  );
}
function ClosetConsent({
  owner,
  name,
  query,
}: {
  owner: string;
  name: string;
  query: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(decision: "allow" | "deny") {
    setBusy(true);
    setError("");
    const params = new URLSearchParams(query);
    params.set("decision", decision);
    params.set("displayed_owner", owner);
    try {
      // A native form navigation suppresses Origin under our no-referrer policy.
      const response = await fetch("/wardrobe/oauth/authorize", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: params,
        redirect: "error",
      });
      const result = await response.json();
      if (!response.ok || typeof result.redirect !== "string") {
        throw new Error(
          response.status === 401 || response.status === 409
            ? "Your wardrobe session changed. Sign in again to connect."
            : "Couldn’t connect your closet. Open the connection from ChatGPT and try again.",
        );
      }
      window.location.replace(result.redirect);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn’t connect your closet. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit("allow");
      }}
    >
      <button type="submit" className="w-primary" disabled={busy}>
        Connect {name}’s closet
      </button>
      <button type="button" disabled={busy} onClick={() => void submit("deny")}>
        Cancel
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
export default function Wardrobe() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selectedId, setSelectedId] = useState("");
  const owner = catalogue?.owner;
  useLayoutEffect(() => {
    if (!owner) return;
    const saved = window.history.state?.wardrobeList;
    const top = !selectedId && saved?.owner === owner ? saved.top : 0;
    window.scrollTo({ top, behavior: "instant" });
  }, [owner, selectedId]);
  const load = useCallback(async () => {
    try {
      const { response, data } = await request("items?includeRetired=1");
      if (response.status === 401) {
        setCatalogue(null);
        setSignedOut(true);
        return;
      }
      if (!response.ok) throw new Error(data.error);
      setCatalogue(data);
      setSignedOut(false);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const syncHash = () => {
      setSelectedId(window.location.hash.slice(1));
    };
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    const frame = requestAnimationFrame(() => {
      void load();
      syncHash();
    });
    window.addEventListener("hashchange", syncHash);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.history.scrollRestoration = previousRestoration;
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", syncHash);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);
  async function logout() {
    try {
      const { response, data } = await request("logout", {});
      if (!response.ok) throw new Error(data.error);
      setCatalogue(null);
      setSignedOut(true);
      setSelectedId("");
      setFilters(initialFilters);
      window.location.hash = "";
    } catch {
      setError("Unable to sign out. Please try again.");
    }
  }
  if (loading)
    return (
      <main className="w-gate">
        <div className="w-brand">Outfits</div>
        <p role="status">Loading…</p>
      </main>
    );
  if (signedOut) return <Login onLogin={load} />;
  if (!catalogue)
    return (
      <main className="w-gate">
        <div className="w-brand">Outfits</div>
        <p role="alert">{error}</p>
        <button className="w-primary" onClick={load}>
          Try again
        </button>
      </main>
    );
  if (selectedId.startsWith("connect?")) {
    return (
      <main className="w-gate">
        <h1>Connect to ChatGPT</h1>
        <p>Allow ChatGPT to add garment images to {catalogue.name}’s closet?</p>
        <ClosetConsent
          key={selectedId + catalogue.owner}
          name={catalogue.name}
          owner={catalogue.owner}
          query={selectedId.slice("connect?".length)}
        />
        <button
          onClick={async () => {
            const pending = window.location.hash;
            await logout();
            window.location.hash = pending;
          }}
        >
          Use a different wardrobe account
        </button>
      </main>
    );
  }
  if (selectedId === "outfits")
    return <main className="w-app">
      <div className="w-toolbar"><ClosetNavigation outfits /><AccountMenu onLogout={logout} /></div>
      <WeeklyOutfits key={catalogue.owner} name={catalogue.name} items={catalogue.items} />
    </main>;
  const selected = catalogue.items.find((item) => item._id === selectedId);
  if (selected)
    return (
      <ItemDetail
        key={selected._id}
        item={selected}
        onSaved={load}
        onDeleted={() => {
          setCatalogue(
            (current) =>
              current && {
                ...current,
                items: current.items.filter(
                  (item) => item._id !== selected._id,
                ),
              },
          );
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname + window.location.search,
          );
          setSelectedId("");
        }}
        onLogout={logout}
      />
    );
  const items = selectItems(catalogue.items.filter((item) => Boolean(item.retirement) === (filters.status === "retired")), filters);
  const sections =
    filters.sort === "category"
      ? categories
          .map((category) => ({
            category,
            items: items.filter((item) => item.category === category),
          }))
          .filter((section) => section.items.length > 0)
      : [{ category: "", items }];
  const CardTitle = filters.sort === "category" ? "h3" : "h2";
  const filtersActive = Boolean(
    filters.status || filters.search ||
    filters.category ||
    filters.color ||
    filters.material ||
    filters.sort !== initialFilters.sort,
  );
  const usedMaterials = Array.from(
    new Set(catalogue.items.map((item) => item.material).filter(Boolean)),
  ).sort();
  const usedColors = colors.filter((color) =>
    catalogue.items.some((item) => item.color === color),
  );
  function filter(key: keyof Filters, value: string) {
    setFilters((previous) => ({ ...previous, [key]: value }));
  }
  return (
    <main className="w-app">
      <ClosetNavigation />
      <div className="w-toolbar">
        <label className="w-search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="10.5"
              cy="10.5"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <input
            type="search"
            placeholder="Search"
            aria-label="Search wardrobe"
            value={filters.search}
            onChange={(event) => filter("search", event.target.value)}
          />
        </label>
        <button
          className="w-icon-button"
          popoverTarget="wardrobe-filters"
          aria-label="Filter items"
          title="Filter items"
        >
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            <path
              d="M8 3v6M16 9v6M10 15v6"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          {filtersActive && (
            <span className="w-filter-dot" aria-label="Filters active" />
          )}
        </button>
        <AccountMenu onLogout={logout} />
      </div>
      {error && (
        <div className="w-error" role="alert">
          {error} <button onClick={load}>Refresh</button>
        </div>
      )}
      <div
        id="wardrobe-filters"
        className="w-popover w-filter-menu"
        popover="auto"
        role="dialog"
        aria-label="Filter items"
      >
        <div className="w-popover-heading">
          <h2>Filters</h2>
          <button
            className="w-icon-button"
            popoverTarget="wardrobe-filters"
            popoverTargetAction="hide"
            aria-label="Close filters"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="w-filter-fields">
          <label>
            Closet status
            <select value={filters.status || ""} onChange={(event) => filter("status", event.target.value)}>
              <option value="">Active</option>
              <option value="retired">Retired</option>
            </select>
          </label>
          <label>
            Category
            <select
              aria-label="Category"
              value={filters.category}
              onChange={(event) => filter("category", event.target.value)}
            >
              <option value="">All categories</option>
              {categories
                .filter((category) =>
                  catalogue.items.some((item) => item.category === category),
                )
                .map((category) => (
                  <option key={category}>{category}</option>
                ))}
            </select>
          </label>
          <ColorFilter
            value={filters.color}
            options={usedColors}
            onChange={(value) => filter("color", value)}
          />
          <label>
            Material
            <select
              aria-label="Material"
              value={filters.material}
              onChange={(event) => filter("material", event.target.value)}
            >
              <option value="">All materials</option>
              {usedMaterials.map((material) => (
                <option key={material}>{material}</option>
              ))}
              <option value="__unknown">Not specified</option>
            </select>
          </label>
          <label>
            Sort by
            <select
              aria-label="Sort by"
              value={filters.sort}
              onChange={(event) => filter("sort", event.target.value)}
            >
              <option value="category">Category</option>
              <option value="recent">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="color">Color</option>
              <option value="material">Material</option>
            </select>
          </label>
        </div>
        <div className="w-filter-actions">
          <button
            className="w-quiet"
            disabled={!filtersActive}
            onClick={() => setFilters(initialFilters)}
          >
            Clear filters
          </button>
          <button
            className="w-primary"
            popoverTarget="wardrobe-filters"
            popoverTargetAction="hide"
          >
            Done
          </button>
        </div>
      </div>
      <p className="w-sr-only" role="status">
        {items.length} matching {items.length === 1 ? "item" : "items"}
      </p>
      {catalogue.items.length === 0 ? (
        <section className="w-empty">
          <p>No items yet.</p>
        </section>
      ) : items.length === 0 ? (
        <section className="w-empty">
          <p>No matching items.</p>
          <button
            className="w-primary"
            onClick={() => setFilters(initialFilters)}
          >
            Show all items
          </button>
        </section>
      ) : (
        sections.map((section) => (
          <section
            key={section.category}
            className="w-closet-section"
            aria-label={section.category || "Your items"}
          >
            {section.category && (
              <h2 className="w-category-heading">{section.category}</h2>
            )}
            <div className="w-grid">
              {section.items.map((item) => (
                <a
                  className="w-card"
                  key={item._id}
                  href={`#${item._id}`}
                  onClick={(event) => {
                    if (
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return;
                    event.preventDefault();
                    const wardrobeList = { owner, top: window.scrollY };
                    window.history.replaceState(
                      { ...window.history.state, wardrobeList },
                      "",
                    );
                    window.history.pushState(
                      { wardrobeList },
                      "",
                      event.currentTarget.href,
                    );
                    setSelectedId(item._id);
                  }}
                >
                  <div className="w-card-image">
                    <ItemImage item={item} view={primaryView(item)} tile />
                  </div>
                  <div className="w-card-info">
                    <CardTitle>{item.name}</CardTitle>
                    <p>
                      {item.color}
                      {item.material ? ` · ${item.material}` : ""}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
function Login({ onLogin }: { onLogin: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const { response, data } = await request("login", {
        username: form.get("username"),
        password: form.get("password"),
      });
      if (!response.ok) throw new Error(data.error);
      await onLogin();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="w-gate">
      <h1>Outfits</h1>
      <form onSubmit={submit}>
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={40}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
          />
        </label>
        {error && (
          <p className="w-error" role="alert">
            {error}
          </p>
        )}
        <button className="w-primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
function ItemDetail({
  item,
  onSaved,
  onDeleted,
  onLogout,
}: {
  item: WardrobeItem;
  onSaved: () => Promise<void>;
  onDeleted: () => void;
  onLogout: () => Promise<void>;
}) {
  const [view, setView] = useState<WardrobeView | undefined>(primaryView(item));
  const [editing, setEditing] = useState(false);
  const [retired, setRetired] = useState(Boolean(item.retirement));
  const [note, setNote] = useState(item.retirement?.note || "");
  const [fields, setFields] = useState<ItemMetadata>({
    name: item.name,
    category: item.category,
    color: item.color,
    material: item.material,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const parsed = metadataSchema.safeParse(fields);
    if (!parsed.success) {
      setMessage("Please check the item details.");
      return;
    }
    setBusy(true);
    try {
      const { response, data } = await request("update", {
        id: item._id,
        fields: parsed.data,
        retirement: retired ? { note } : null,
        expectedUpdatedAt: item.updatedAt,
      });
      if (!response.ok) throw new Error(data.error);
      await onSaved();
      setEditing(false);
      setMessage("Changes saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !window.confirm(
        `Delete “${item.name}” from your closet? This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const { response, data } = await request("delete", {
        id: item._id,
        expectedUpdatedAt: item.updatedAt,
      });
      if (!response.ok) throw new Error(data.error);
      onDeleted();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete this item. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <main className="w-app w-detail">
      <div className="w-toolbar w-detail-toolbar">
        <a
          className="w-back"
          href="#"
          onClick={(event) => {
            if (
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey &&
              window.history.state?.wardrobeList
            ) {
              event.preventDefault();
              window.history.back();
            }
          }}
        >
          ← <span>My wardrobe</span>
        </a>
        <AccountMenu onLogout={onLogout} />
      </div>
      <div className="w-detail-layout">
        <section className="w-gallery" aria-label="Item images">
          <div className="w-main-image">
            <ItemImage key={view} item={item} view={view} eager />
          </div>
          {item.views.length > 0 && (
            <div className="w-view-tabs" aria-label="Image view">
              {item.views
                .filter((v) => v !== "source")
                .map((v) => (
                  <button
                    key={v}
                    className={v === view ? "active" : ""}
                    aria-pressed={v === view}
                    onClick={() => setView(v)}
                  >
                    {labels[v]}
                  </button>
                ))}
            </div>
          )}
          {item.views.includes("source") && (
            <button
              className="w-source-button"
              aria-pressed={view === "source"}
              onClick={() =>
                setView(view === "source" ? primaryView(item) : "source")
              }
            >
              {view === "source"
                ? "Back to catalogue images"
                : "View original frame"}
            </button>
          )}
        </section>
        <section className="w-item-details">
          <h1>{item.name}</h1>
          {!editing ? (
            <>
              <dl>
                <div>
                  <dt>Category</dt>
                  <dd>{item.category}</dd>
                </div>
                <div>
                  <dt>Color</dt>
                  <dd>{item.color}</dd>
                </div>
                <div>
                  <dt>Material</dt>
                  <dd>{item.material || "Not specified"}</dd>
                </div>
                {item.retirement && <div><dt>Retired</dt><dd>{item.retirement.note || "Retired from closet"}</dd></div>}
              </dl>
              <button
                className="w-edit"
                disabled={busy}
                onClick={() => {
                  setRetired(Boolean(item.retirement));
                  setNote(item.retirement?.note || "");
                  setFields({
                    name: item.name,
                    category: item.category,
                    color: item.color,
                    material: item.material,
                  });
                  setMessage("");
                  setEditing(true);
                }}
              >
                Edit details <span aria-hidden="true">↗</span>
              </button>
              <button className="w-delete" disabled={busy} onClick={remove}>
                {busy ? "Deleting…" : "Delete item"}
              </button>
            </>
          ) : (
            <form className="w-edit-form" onSubmit={save}>
              <label>
                Name
                <input
                  value={fields.name}
                  maxLength={120}
                  required
                  onChange={(e) =>
                    setFields({ ...fields, name: e.target.value })
                  }
                />
              </label>
              <label>
                Category
                <select
                  aria-label="Category"
                  value={fields.category}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      category: e.target.value as ItemMetadata["category"],
                    })
                  }
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Color
                <select
                  aria-label="Color"
                  value={fields.color}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      color: e.target.value as ItemMetadata["color"],
                    })
                  }
                >
                  {colors.map((color) => (
                    <option key={color}>{color}</option>
                  ))}
                </select>
              </label>
              <label>
                Material <span className="w-optional">optional</span>
                <input
                  list="wardrobe-materials"
                  value={fields.material}
                  placeholder="Leave blank if unknown"
                  maxLength={120}
                  onChange={(e) =>
                    setFields({ ...fields, material: e.target.value })
                  }
                />
                <datalist id="wardrobe-materials">
                  {materials.map((material) => (
                    <option key={material} value={material} />
                  ))}
                </datalist>
              </label>
              <label>
                Closet status
                <select value={retired ? "retired" : "active"} onChange={(event) => setRetired(event.target.value === "retired")}>
                  <option value="active">Active</option>
                  <option value="retired">Retired</option>
                </select>
              </label>
              {retired && <label>Retirement note <span className="w-optional">optional</span>
                <input value={note} maxLength={600} onChange={(event) => setNote(event.target.value)} />
              </label>}
              <div className="w-edit-actions">
                <button
                  type="button"
                  className="w-quiet"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false);
                    setMessage("");
                  }}
                >
                  Cancel
                </button>
                <button className="w-primary" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}
          {message && (
            <p
              className={message === "Changes saved." ? "w-success" : "w-error"}
              role="status"
            >
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
