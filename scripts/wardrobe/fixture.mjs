import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
process.loadEnvFile(".env.local");
if (new URL(process.env.CONVEX_URL).hostname !== "127.0.0.1")
  throw new Error("Fixture is local only.");
const dir = ".daso/wardrobe-fixture";
mkdirSync(dir, { recursive: true });
const entries = [
  ["Black linen shirt", "Shirts", "Black", "Linen", "#30312d", "shirt"],
  ["Cream cable knit", "Knitwear", "Cream", "Wool", "#ded6c4", "shirt"],
  ["Everyday blue jeans", "Jeans", "Blue", "Denim", "#67798b", "trousers"],
  ["Olive overshirt", "Jackets & coats", "Green", "Cotton", "#768069", "shirt"],
  ["Black wool pants", "Pants", "Black", "Wool", "#3b3b38", "trousers"],
  ["Gold chain necklace", "Jewelry", "Gold", "", "#b59b5f", "necklace"],
  ["Soft leather tote", "Bags", "Brown", "Leather", "#98755a", "bag"],
  ["White cotton tee", "Tops", "White", "Cotton", "#e6e2d8", "shirt"],
];
for (const [index, entry] of entries.entries()) {
  const [, , , , color, shape] = entry;
  for (const view of ["front", "side", "back"]) {
    const figure =
      shape === "trousers"
        ? '<path d="M185 95h230l-18 270-20 140h-75l-2-240-2 240h-75l-20-140z"/>'
        : shape === "bag"
          ? '<path d="M160 220h280l28 275H132z"/><path d="M220 235V170c0-90 160-90 160 0v65" fill="none" stroke-width="18"/>'
          : shape === "necklace"
            ? '<ellipse cx="300" cy="290" rx="110" ry="165" fill="none" stroke-width="9"/><circle cx="300" cy="450" r="14"/>'
            : '<path d="m215 130-70 30-70 110 75 45 45-65-12 260h234l-12-260 45 65 75-45-70-110-70-30c-25 55-105 55-130 0z"/>';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 600"><rect width="600" height="600" fill="#f0eee8"/><g fill="${color}" stroke="${color}" transform="${view === "side" ? "translate(120 0) scale(.6 1)" : ""}">${figure}</g><text x="300" y="570" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#777">SAMPLE ITEM · ${view.toUpperCase()}</text></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(`${dir}/${index}-${view}.png`);
  }
}
for (const owner of ["max", "zhanel"]) {
  const ownerEntries = owner === "max" ? entries : entries.slice(5);
  const manifest = {
    owner,
    items: ownerEntries.map((entry) => {
      const index = entries.indexOf(entry);
      const [name, category, color, material, , shape] = entry;
      return {
        externalId: `sample-${index}`,
        name,
        category,
        color,
        material,
        images:
          shape === "necklace" || shape === "bag"
            ? { front: `${index}-front.png` }
            : {
                front: `${index}-front.png`,
                side: `${index}-side.png`,
                back: `${index}-back.png`,
              },
      };
    }),
  };
  const path = `${dir}/${owner}.json`;
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  execFileSync(process.execPath, ["scripts/wardrobe/import.mjs", path], {
    stdio: "inherit",
  });
}
