import { expect, it } from "vitest";
import {
  selectItems,
  type Filters,
  type WardrobeItem,
} from "../../shared/wardrobe";

const items: WardrobeItem[] = [
  {
    _id: "tee",
    name: "White graphic T-shirt",
    category: "Tops",
    color: "White",
    material: "Cotton",
    views: [],
    addedAt: 4,
    updatedAt: 4,
  },
  {
    _id: "skirt",
    name: "Black pleated maxi skirt",
    category: "Skirts",
    color: "Black",
    material: "",
    views: [],
    addedAt: 3,
    updatedAt: 3,
  },
  {
    _id: "jeans",
    name: "Blue jeans",
    category: "Jeans",
    color: "Blue",
    material: "Denim",
    views: [],
    addedAt: 2,
    updatedAt: 2,
  },
];
const filters: Filters = {
  search: "",
  category: "",
  color: "",
  material: "",
  sort: "recent",
};

it.each([
  ["whte tshrt", ["tee"]],
  ["whiet cottn", ["tee"]],
  ["skrit blak", ["skirt"]],
  ["skirt pleatd", ["skirt"]],
  ["cotton white", ["tee"]],
  ["CÓTTON WHITE", ["tee"]],
  ["tshirt", ["tee"]],
  ["t shirt", ["tee"]],
  ["t-shirt", ["tee"]],
  ["denm", ["jeans"]],
  ["pleatde", ["skirt"]],
  ["sweater", []],
  ["red", []],
  ["white skirt", []],
] as [string, string[]][])(
  "finds useful fuzzy matches for %s without matching unrelated items",
  (search, expected) => {
    expect(
      selectItems(items, { ...filters, search }).map((item) => item._id),
    ).toEqual(expected);
  },
);

it("keeps metadata filters strict and preserves the chosen sort", () => {
  expect(
    selectItems(items, { ...filters, search: "whte", color: "Black" }),
  ).toEqual([]);
  expect(
    selectItems(items, {
      ...filters,
      search: "skrit",
      material: "__unknown",
    }).map((item) => item._id),
  ).toEqual(["skirt"]);
  expect(
    selectItems(items, {
      ...filters,
      search: "jeans skirt",
      category: "Jeans",
    }),
  ).toEqual([]);
  expect(
    selectItems(items, { ...filters, search: "", sort: "recent" }).map(
      (item) => item._id,
    ),
  ).toEqual(["tee", "skirt", "jeans"]);
  expect(
    selectItems(items, { ...filters, search: "", sort: "name" }).map(
      (item) => item._id,
    ),
  ).toEqual(["skirt", "jeans", "tee"]);
  expect(items.map((item) => item._id)).toEqual(["tee", "skirt", "jeans"]);
});
