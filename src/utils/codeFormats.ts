export interface CodeFormat {
  key: string;
  label: string;
  code: string;
}

const channel = (v: number) => {
  const s = (v / 255).toFixed(3);
  return s.replace(/\.?0+$/, "") || "0";
};

export function codeFormats(rgb: [number, number, number]): CodeFormat[] {
  const [r, g, b] = rgb;
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;

  return [
    { key: "css", label: "CSS", code: `--color: ${hex};` },
    { key: "tailwind", label: "Tailwind", code: `bg-[${hex}]` },
    {
      key: "swift",
      label: "SwiftUI",
      code: `Color(red: ${channel(r)}, green: ${channel(g)}, blue: ${channel(b)})`,
    },
    { key: "flutter", label: "Flutter", code: `Color(0xFF${hex.slice(1).toUpperCase()})` },
  ];
}
