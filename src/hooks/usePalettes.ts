import { useSyncExternalStore, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Palette } from "../types/color";
import { generateId } from "../utils/colorConvert";

/**
 * Shared palette store. A single module-level state backs every usePalettes()
 * caller, so a palette saved from the Themes screen shows up immediately in the
 * My Palettes screen (they no longer hold separate copies of the list).
 */
let palettes: Palette[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Load once, lazily, on first subscriber
  if (!loaded) {
    loaded = true;
    invoke<Palette[]>("load_palettes")
      .then((p) => {
        palettes = p;
        emit();
      })
      .catch((err) => console.error("Failed to load palettes:", err));
  }
  return () => listeners.delete(listener);
}

function setPalettes(next: Palette[]) {
  palettes = next;
  emit();
  invoke("save_palettes", { palettes: next }).catch((err) =>
    console.error("Failed to save palettes:", err)
  );
}

export function usePalettes() {
  const list = useSyncExternalStore(subscribe, () => palettes);

  const createPalette = useCallback((name: string, colors: string[] = []) => {
    const palette: Palette = { id: generateId(), name: name.trim() || "Untitled", colors };
    setPalettes([palette, ...palettes]);
    return palette;
  }, []);

  const deletePalette = useCallback(
    (id: string) => setPalettes(palettes.filter((p) => p.id !== id)),
    []
  );

  const addColorToPalette = useCallback(
    (id: string, hex: string) =>
      setPalettes(
        palettes.map((p) =>
          p.id === id && !p.colors.includes(hex) ? { ...p, colors: [...p.colors, hex] } : p
        )
      ),
    []
  );

  const removeColorFromPalette = useCallback(
    (id: string, hex: string) =>
      setPalettes(
        palettes.map((p) =>
          p.id === id ? { ...p, colors: p.colors.filter((c) => c !== hex) } : p
        )
      ),
    []
  );

  return { palettes: list, createPalette, deletePalette, addColorToPalette, removeColorFromPalette };
}
