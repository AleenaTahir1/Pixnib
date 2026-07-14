import { Palette } from "../types/color";
import { hexToRgb } from "./contrast";

export type ExportFormat = "css" | "scss" | "json";

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "color";

export function exportPalette(palette: Palette, format: ExportFormat): string {
  const base = slug(palette.name);

  switch (format) {
    case "css":
      return [
        ":root {",
        ...palette.colors.map((hex, i) => `  --${base}-${(i + 1) * 100}: ${hex.toUpperCase()};`),
        "}",
      ].join("\n");

    case "scss":
      return palette.colors
        .map((hex, i) => `$${base}-${(i + 1) * 100}: ${hex.toUpperCase()};`)
        .join("\n");

    case "json":
      return JSON.stringify(
        {
          name: palette.name,
          colors: palette.colors.map((hex) => {
            const [r, g, b] = hexToRgb(hex);
            return { hex: hex.toUpperCase(), rgb: [r, g, b] };
          }),
        },
        null,
        2
      );
  }
}
