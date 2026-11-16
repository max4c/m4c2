import { z } from "zod";

export const owners = ["max", "zhanel"] as const;
export type WardrobeOwner = (typeof owners)[number];
export const ownerName = { max: "Max", zhanel: "Zhanel" };
export const categories = [
  "Tops",
  "Shirts",
  "Knitwear",
  "Jackets & coats",
  "Dresses",
  "Pants",
  "Jeans",
  "Shorts",
  "Skirts",
  "Activewear",
  "Shoes",
  "Bags",
  "Jewelry",
  "Watches",
  "Accessories",
  "Other",
] as const;
// Closet swatches in descending relative luminance.
export const colors = [
  "White",
  "Cream",
  "Yellow",
  "Silver",
  "Beige",
  "Pink",
  "Gold",
  "Orange",
  "Grey",
  "Blue",
  "Green",
  "Purple",
  "Red",
  "Brown",
  "Navy",
  "Black",
  "Multicolor",
  "Unknown",
] as const;
export const materials = [
  "Cotton",
  "Linen",
  "Wool",
  "Silk",
  "Cashmere",
  "Denim",
  "Leather",
  "Polyester",
  "Nylon",
  "Viscose",
  "Blend",
  "Metal",
];
export const views = ["front", "side", "back", "detail", "source"] as const;
export type WardrobeView = (typeof views)[number];
export const metadataSchema = z
  .object({
    name: z.string().trim().min(1, "Give this item a name.").max(120),
    category: z.enum(categories),
    color: z.enum(colors),
    material: z.string().trim().max(120).default(""),
  })
  .strict();
export type ItemMetadata = z.infer<typeof metadataSchema>;
export type WardrobeItem = ItemMetadata & {
  retirement?: { note: string };
  _id: string;
  addedAt: number;
  updatedAt: number;
  views: WardrobeView[];
};
export type Filters = {
  status?: string;
  search: string;
  category: string;
  color: string;
  material: string;
  sort: string;
};
function searchWords(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\bt\s+shirts?\b/g, (word) => word.replace(/\s/g, ""))
      .replace(/[-‐‑‒–—]/g, "")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function matchesWord(term: string, word: string) {
  if (word.includes(term)) return true;
  // Short queries stay literal; longer words allow typos and swapped letters.
  const limit = term.length >= 7 ? 2 : term.length >= 4 ? 1 : 0;
  if (!limit || Math.abs(term.length - word.length) > limit) return false;
  const distance = Array.from({ length: term.length + 1 }, (_, i) =>
    Array.from({ length: word.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= term.length; i++) {
    for (let j = 1; j <= word.length; j++) {
      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + Number(term[i - 1] !== word[j - 1]),
      );
      if (
        i > 1 &&
        j > 1 &&
        term[i - 1] === word[j - 2] &&
        term[i - 2] === word[j - 1]
      ) {
        distance[i][j] = Math.min(distance[i][j], distance[i - 2][j - 2] + 1);
      }
    }
  }
  return distance[term.length][word.length] <= limit;
}

export function selectItems(items: WardrobeItem[], filters: Filters) {
  const terms = searchWords(filters.search);
  return items
    .filter(
      (item) =>
        (!filters.category || item.category === filters.category) &&
        (!filters.color || item.color === filters.color) &&
        (!filters.material ||
          (filters.material === "__unknown"
            ? !item.material
            : item.material === filters.material)),
    )
    .filter((item) => {
      if (!terms.length) return true;
      const words = searchWords(
        [item.name, item.category, item.color, item.material].join(" "),
      );
      return terms.every((term) =>
        words.some((word) => matchesWord(term, word)),
      );
    })
    .sort((a, b) => {
      if (filters.sort === "recent")
        return b.addedAt - a.addedAt || a.name.localeCompare(b.name);
      if (filters.sort === "category" || filters.sort === "color") {
        const categoryOrder =
          filters.sort === "category"
            ? categories.indexOf(a.category) - categories.indexOf(b.category)
            : 0;
        return (
          categoryOrder ||
          colors.indexOf(a.color) - colors.indexOf(b.color) ||
          a.name.localeCompare(b.name)
        );
      }
      const field = filters.sort === "material" ? "material" : "name";
      return a[field].localeCompare(b[field]) || a.name.localeCompare(b.name);
    });
}
