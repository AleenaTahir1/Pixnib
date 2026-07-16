import niceRaw from "nice-color-palettes/1000.json";
import sanzoRaw from "dictionary-of-colour-combinations/colors.json";
import { THEME_CATEGORIES } from "../utils/themePalettes";
import { rgbToHsl } from "../utils/colorConvert";
import { hexToRgb } from "../utils/contrast";

export interface Palette {
  name: string;
  colors: string[];
  mood: string;
  featured?: boolean;
}

export interface Mood {
  key: string;
  label: string;
}

export const MOODS: Mood[] = [
  { key: "featured", label: "Featured" },
  { key: "warm", label: "Warm" },
  { key: "cool", label: "Cool" },
  { key: "pastel", label: "Pastel" },
  { key: "vibrant", label: "Vibrant" },
  { key: "neon", label: "Neon" },
  { key: "earthy", label: "Earthy" },
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
  { key: "muted", label: "Muted" },
];

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Bucket a palette into a mood using average HSL and warm/cool hue balance. */
function classify(colors: string[]): string {
  const hsl = colors.map((hex) => {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHsl(r, g, b); // [h 0-360, s 0-100, l 0-100]
  });
  const avgL = mean(hsl.map((c) => c[2]));
  const avgS = mean(hsl.map((c) => c[1]));
  const warm = hsl.filter((c) => c[1] > 12 && (c[0] <= 50 || c[0] >= 330)).length;
  const cool = hsl.filter((c) => c[1] > 12 && c[0] >= 170 && c[0] <= 280).length;
  const half = colors.length / 2;

  if (avgL < 28) return "dark";
  if (avgL > 84 && avgS < 45) return "light";
  if (avgS > 80 && avgL >= 42 && avgL <= 72) return "neon";
  if (avgL > 72 && avgS >= 20 && avgS < 72) return "pastel";
  if (avgS < 22) return "muted";
  if (warm >= half && warm >= cool) return avgS < 46 ? "earthy" : "warm";
  if (cool >= half && cool > warm) return "cool";
  if (avgS >= 58) return "vibrant";
  return "muted";
}

// 1) Hand-curated, categorized palettes stay as the "Featured" set (nice names).
const featured: Palette[] = THEME_CATEGORIES.flatMap((cat) =>
  cat.themes.map((t) => ({
    name: t.name,
    colors: t.colors.map((c) => c.toUpperCase()),
    mood: classify(t.colors),
    featured: true,
  }))
);

// 2) nice-color-palettes: 5-color palettes, auto-categorized (MIT).
const nice: Palette[] = (niceRaw as string[][]).map((colors, i) => ({
  name: `Palette ${i + 1}`,
  colors: colors.map((c) => c.toUpperCase()),
  mood: classify(colors),
}));

// 3) Sanzo Wada dictionary: named colors grouped into 2-4 color combinations (MIT).
type SanzoColor = { hex: string; combinations: number[] };
const groups = new Map<number, string[]>();
for (const c of sanzoRaw as SanzoColor[]) {
  for (const idx of c.combinations) {
    if (!groups.has(idx)) groups.set(idx, []);
    groups.get(idx)!.push(c.hex.toUpperCase());
  }
}
const sanzo: Palette[] = [...groups.entries()]
  .filter(([, colors]) => colors.length >= 2 && colors.length <= 5)
  .map(([id, colors]) => ({ name: `Sanzo ${id}`, colors, mood: classify(colors) }));

const ALL: Palette[] = [...featured, ...nice, ...sanzo];

/** Palettes for a mood, optionally filtered to an exact color count. */
export function getPalettes(mood: string, size: number | null): Palette[] {
  const pool = mood === "featured" ? ALL.filter((p) => p.featured) : ALL.filter((p) => p.mood === mood);
  return size ? pool.filter((p) => p.colors.length === size) : pool;
}

/** Which exact sizes exist for a mood, so the size filter only offers real ones. */
export function sizesFor(mood: string): number[] {
  const pool = mood === "featured" ? ALL.filter((p) => p.featured) : ALL.filter((p) => p.mood === mood);
  return [...new Set(pool.map((p) => p.colors.length))].sort((a, b) => a - b);
}
