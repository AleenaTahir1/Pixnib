export interface Theme {
  name: string;
  colors: string[]; // hex values, top to bottom
}

export interface ThemeCategory {
  key: string;
  label: string;
  themes: Theme[];
}

/**
 * Curated designer palettes grouped by mood, in the spirit of Color Hunt /
 * Coolors / Adobe Color. Hand-picked harmonious combinations so users get a
 * ready-made scheme instead of guessing which colors go together.
 */
export const THEME_CATEGORIES: ThemeCategory[] = [
  {
    key: "popular",
    label: "Popular",
    themes: [
      { name: "Midnight Teal", colors: ["#222831", "#393E46", "#00ADB5", "#EEEEEE"] },
      { name: "Ocean Breeze", colors: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4"] },
      { name: "Berry Smoothie", colors: ["#453C67", "#6D67E4", "#46C2CB", "#F2F7A1"] },
      { name: "Mocha Mousse", colors: ["#4A3F35", "#A47864", "#C9ADA1", "#E8D8C4"] },
      { name: "Coral Reef", colors: ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"] },
      { name: "Slate & Sage", colors: ["#222831", "#31363F", "#76ABAE", "#EEEEEE"] },
    ],
  },
  {
    key: "pastel",
    label: "Pastel",
    themes: [
      { name: "Cotton Candy", colors: ["#FFC0D9", "#F0F0F0", "#8DDFCB", "#578FCA"] },
      { name: "Soft Meadow", colors: ["#CBFFA9", "#FFFED3", "#FFD0D0", "#FF9494"] },
      { name: "Baby Sky", colors: ["#BDE8FF", "#D6F5FF", "#FFF6BD", "#FFD9C0"] },
      { name: "Lavender Dream", colors: ["#E5D9F2", "#F5EFFF", "#CDC1FF", "#A594F9"] },
      { name: "Peach Cream", colors: ["#FFDCDC", "#FFF2EB", "#FFE8CD", "#FFD6BA"] },
    ],
  },
  {
    key: "vintage",
    label: "Vintage",
    themes: [
      { name: "Retro Post", colors: ["#E13A3D", "#F77C43", "#E7E8AB", "#87C987", "#BCE0F5"] },
      { name: "Faded Film", colors: ["#7D6167", "#A97C73", "#D4A59A", "#E8D3C0"] },
      { name: "Old Paper", colors: ["#102C57", "#DAC0A3", "#EADBC8", "#F8F0E5"] },
      { name: "Dusty Rose", colors: ["#B25068", "#E96479", "#F5E9CF", "#7C9070"] },
    ],
  },
  {
    key: "retro",
    label: "Retro",
    themes: [
      { name: "Arcade", colors: ["#613FD1", "#008EF3", "#31CC5D", "#FFC107", "#F35F0F"] },
      { name: "Seventies", colors: ["#722880", "#D72D51", "#EB5C18", "#F08800", "#DEB600"] },
      { name: "Diner", colors: ["#EF5B5B", "#FFBA49", "#23CE6B", "#20A39E"] },
      { name: "VHS", colors: ["#2D0A31", "#FF2E63", "#08D9D6", "#EAEAEA"] },
    ],
  },
  {
    key: "neon",
    label: "Neon",
    themes: [
      { name: "Cyberpunk", colors: ["#0D0221", "#FF206E", "#FBFF12", "#41EAD4"] },
      { name: "Electric", colors: ["#08F7FE", "#09FBD3", "#FE53BB", "#F5D300"] },
      { name: "Miami", colors: ["#FF6EC7", "#01CDFE", "#05FFA1", "#B967FF"] },
      { name: "Synthwave", colors: ["#2B0F54", "#AB1F65", "#FF4A6E", "#FF8C42"] },
    ],
  },
  {
    key: "warm",
    label: "Warm",
    themes: [
      { name: "Autumn", colors: ["#DAD4B5", "#F8B195", "#F67280", "#C06C84"] },
      { name: "Terracotta", colors: ["#C1440E", "#E27D60", "#E8A87C", "#C38D9E"] },
      { name: "Golden Hour", colors: ["#FFB627", "#FF9505", "#E2711D", "#CC5803"] },
      { name: "Spiced", colors: ["#6F1D1B", "#BB9457", "#99582A", "#432818"] },
    ],
  },
  {
    key: "cool",
    label: "Cool",
    themes: [
      { name: "Arctic", colors: ["#CAF0F8", "#90E0EF", "#00B4D8", "#0077B6", "#03045E"] },
      { name: "Forest", colors: ["#1A4D2E", "#4F6F52", "#739072", "#ECE3CE"] },
      { name: "Deep Sea", colors: ["#0B2447", "#19376D", "#576CBC", "#A5D7E8"] },
      { name: "Frost", colors: ["#E3FDFD", "#CBF1F5", "#A6E3E9", "#71C9CE"] },
    ],
  },
  {
    key: "earthy",
    label: "Earthy",
    themes: [
      { name: "Sand & Clay", colors: ["#C8B6A6", "#A4907C", "#8D7B68", "#F1DEC9"] },
      { name: "Olive Grove", colors: ["#626F47", "#A4B465", "#F0BB78", "#FEFAE0"] },
      { name: "Desert", colors: ["#E3CAA5", "#CEAB93", "#AD8B73", "#4A4947"] },
      { name: "Moss", colors: ["#3E362E", "#865D36", "#93785B", "#AC8968"] },
    ],
  },
  {
    key: "dark",
    label: "Dark",
    themes: [
      { name: "Obsidian", colors: ["#0D0D0D", "#1A1A1A", "#2E2E2E", "#E0E0E0"] },
      { name: "Midnight", colors: ["#0F0E17", "#232946", "#B8C1EC", "#FFFFFE"] },
      { name: "Noir Gold", colors: ["#000000", "#14213D", "#FCA311", "#E5E5E5"] },
      { name: "Charcoal", colors: ["#16171A", "#2D2D34", "#56575C", "#A9A9B2"] },
    ],
  },
  {
    key: "light",
    label: "Light",
    themes: [
      { name: "Paper", colors: ["#FFFFFF", "#F5F5F5", "#E0E0E0", "#212121"] },
      { name: "Cream", colors: ["#FEFAE0", "#FAEDCD", "#E9EDC9", "#CCD5AE"] },
      { name: "Mist", colors: ["#F8F9FA", "#E9ECEF", "#DEE2E6", "#495057"] },
      { name: "Blossom", colors: ["#FFF0F3", "#FFCCD5", "#FFB3C1", "#FF758F"] },
    ],
  },
];
