import { useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Palette } from "../types/color";
import { usePalettes } from "../hooks/usePalettes";
import { exportPalette, ExportFormat } from "../utils/paletteExport";

interface PalettesProps {
  open: boolean;
  onClose: () => void;
  /** Hex of the currently displayed color, offered as a quick-add. */
  current: string | null;
}

const EXPORTS: ExportFormat[] = ["css", "scss", "json"];

export function Palettes({ open, onClose, current }: PalettesProps) {
  const { palettes, createPalette, deletePalette, addColorToPalette, removeColorFromPalette } =
    usePalettes();
  const [newName, setNewName] = useState("");
  const [exported, setExported] = useState<string | null>(null);

  const handleExport = async (palette: Palette, format: ExportFormat) => {
    await writeText(exportPalette(palette, format));
    setExported(`${palette.id}-${format}`);
    setTimeout(() => setExported(null), 1500);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPalette(newName, current ? [current.toUpperCase()] : []);
    setNewName("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-base)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] shrink-0">
        <button
          onClick={onClose}
          title="Back"
          className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-100 -ml-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-[14px] font-semibold">Palettes</h2>
      </div>

      {/* New palette */}
      <div className="px-4 py-3 border-b border-[var(--border)] shrink-0 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New palette name…"
          className="flex-1 min-w-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-border)]"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="px-3.5 py-2 rounded-lg bg-[var(--accent)] text-[var(--on-accent)] text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity duration-100 shrink-0"
        >
          Create
        </button>
      </div>

      {/* Palette list */}
      <div className="flex-1 scroll-y px-4 py-4 space-y-3">
        {palettes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center text-[var(--text-muted)]">
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">No palettes yet</p>
            <p className="text-[11px] mt-1">Name one above to start collecting colors</p>
          </div>
        )}

        {palettes.map((palette) => (
          <div key={palette.id} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium truncate">{palette.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                {current && !palette.colors.includes(current.toUpperCase()) && (
                  <button
                    onClick={() => addColorToPalette(palette.id, current.toUpperCase())}
                    title="Add current color"
                    className="px-2 py-1 rounded-md text-[10px] font-medium text-[var(--accent)] bg-[var(--accent-soft)] border border-[var(--accent-border)] hover:opacity-80 transition-opacity duration-100"
                  >
                    + Add
                  </button>
                )}
                <button
                  onClick={() => deletePalette(palette.id)}
                  title="Delete palette"
                  className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors duration-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Color chips */}
            {palette.colors.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {palette.colors.map((hex) => (
                  <button
                    key={hex}
                    title={`${hex} · click to remove`}
                    onClick={() => removeColorFromPalette(palette.id, hex)}
                    className="w-6 h-6 rounded-md border border-[var(--border-hover)] hover:scale-110 transition-transform duration-100 relative group"
                    style={{ backgroundColor: hex }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      <svg className="w-3 h-3 text-white mix-blend-difference" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)]">Empty. Add the current color with “+ Add”.</p>
            )}

            {/* Export */}
            {palette.colors.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mr-0.5">Export</span>
                {EXPORTS.map((format) => (
                  <button
                    key={format}
                    onClick={() => handleExport(palette, format)}
                    className="px-2 py-1 rounded-md text-[10px] font-medium uppercase border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] transition-colors duration-100"
                  >
                    {exported === `${palette.id}-${format}` ? "Copied!" : format}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
