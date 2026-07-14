import { useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { THEME_CATEGORIES, Theme } from "../utils/themePalettes";
import { usePalettes } from "../hooks/usePalettes";
import { getContrastColor } from "../utils/colorConvert";
import { hexToRgb } from "../utils/contrast";

interface ThemesProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Browsable library of curated designer palettes. Click any swatch to copy its
 * hex, copy a whole palette at once, or save it into your own palettes.
 */
export function Themes({ open, onClose }: ThemesProps) {
  const { createPalette } = usePalettes();
  const [cat, setCat] = useState(THEME_CATEGORIES[0].key);
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const active = THEME_CATEGORIES.find((c) => c.key === cat) ?? THEME_CATEGORIES[0];

  const copyOne = async (key: string, hex: string) => {
    await writeText(hex.toUpperCase());
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  const copyAll = async (theme: Theme) => {
    await writeText(theme.colors.map((c) => c.toUpperCase()).join(", "));
    setCopied(`all-${theme.name}`);
    setTimeout(() => setCopied(null), 1200);
  };

  const save = (theme: Theme) => {
    createPalette(theme.name, theme.colors.map((c) => c.toUpperCase()));
    setSaved(theme.name);
    setTimeout(() => setSaved(null), 1500);
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
        <h2 className="text-[14px] font-semibold">Theme palettes</h2>
      </div>

      {/* Category pills */}
      <div className="shrink-0 border-b border-[var(--border)] overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 px-4 py-2.5 w-max">
          {THEME_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors duration-100 ${
                cat === c.key
                  ? "bg-[var(--accent)] text-[var(--on-accent)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme cards */}
      <div className="flex-1 scroll-y px-4 py-4 grid grid-cols-2 gap-3">
        {active.themes.map((theme) => (
          <div key={theme.name} className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-surface)]">
            {/* Swatch stack */}
            <div className="flex flex-col">
              {theme.colors.map((hex) => {
                const key = `${theme.name}-${hex}`;
                return (
                  <button
                    key={key}
                    onClick={() => copyOne(key, hex)}
                    className="h-8 flex items-center justify-between px-2.5 group"
                    style={{ backgroundColor: hex }}
                    title={`${hex.toUpperCase()} · click to copy`}
                  >
                    <span
                      className="font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                      style={{ color: getContrastColor(hexToRgb(hex)) }}
                    >
                      {hex.toUpperCase()}
                    </span>
                    {copied === key && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke={getContrastColor(hexToRgb(hex))}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-2.5 py-2 gap-1">
              <span className="text-[11px] font-medium truncate">{theme.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => copyAll(theme)}
                  title="Copy all hex"
                  className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
                >
                  {copied === `all-${theme.name}` ? (
                    <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V5a2 2 0 012-2h10" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => save(theme)}
                  title="Save to my palettes"
                  className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors duration-100"
                >
                  {saved === theme.name ? (
                    <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
