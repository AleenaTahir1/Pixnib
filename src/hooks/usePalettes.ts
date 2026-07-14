import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Palette } from "../types/color";
import { generateId } from "../utils/colorConvert";

export function usePalettes() {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    invoke<Palette[]>("load_palettes")
      .then(setPalettes)
      .catch((err) => console.error("Failed to load palettes:", err));
  }, []);

  const persist = useCallback((next: Palette[]) => {
    setPalettes(next);
    invoke("save_palettes", { palettes: next }).catch((err) =>
      console.error("Failed to save palettes:", err)
    );
  }, []);

  const createPalette = useCallback(
    (name: string, colors: string[] = []) => {
      const palette: Palette = { id: generateId(), name: name.trim() || "Untitled", colors };
      persist([palette, ...palettes]);
      return palette;
    },
    [palettes, persist]
  );

  const deletePalette = useCallback(
    (id: string) => persist(palettes.filter((p) => p.id !== id)),
    [palettes, persist]
  );

  const addColorToPalette = useCallback(
    (id: string, hex: string) =>
      persist(
        palettes.map((p) =>
          p.id === id && !p.colors.includes(hex)
            ? { ...p, colors: [...p.colors, hex] }
            : p
        )
      ),
    [palettes, persist]
  );

  const removeColorFromPalette = useCallback(
    (id: string, hex: string) =>
      persist(
        palettes.map((p) =>
          p.id === id ? { ...p, colors: p.colors.filter((c) => c !== hex) } : p
        )
      ),
    [palettes, persist]
  );

  return {
    palettes,
    createPalette,
    deletePalette,
    addColorToPalette,
    removeColorFromPalette,
  };
}
