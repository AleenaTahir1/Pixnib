export interface ColorInfo {
  hex: string;
  rgb: [number, number, number];
  x: number;
  y: number;
}

export interface ColorEntry {
  id: string;
  hex: string;
  rgb: [number, number, number];
  timestamp: number;
  label?: string;
}

export interface LoupeData {
  colors: string[]; // grid×grid hex values, row-major
  hex: string; // center pixel
  x: number;
  y: number;
}

export type ColorFormat = "hex" | "rgb" | "rgba" | "hsl" | "css-var";
