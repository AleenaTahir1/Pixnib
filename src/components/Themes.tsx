import { useMemo, useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { MOODS, getPalettes, sizesFor, Palette } from "../data/palettes";
import { usePalettes } from "../hooks/usePalettes";
import { getContrastColor } from "../utils/colorConvert";
import { hexToRgb } from "../utils/contrast";

interface ThemesProps {
  open: boolean;
  onClose: () => void;
}

const PAGE = 48;

/**
 * Browsable library of ~1300 curated palettes (hand-picked + nice-color-palettes
 * + Sanzo Wada, all MIT). Filter by mood and by color count; hover a band to see
 * its hex, click to copy; "Copy all" grabs the stack; Save sends it to My palettes.
 */
export function Themes({ open, onClose }: ThemesProps) {
  const { createPalette } = usePalettes();
  const [mood, setMood] = useState("featured");
  const [size, setSize] = useState<number | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const sizes = useMemo(() => sizesFor(mood), [mood]);
  const palettes = useMemo(() => getPalettes(mood, size), [mood, size]);
  const shown = palettes.slice(0, limit);

  const pick = (nextMood: string) => {
    setMood(nextMood);
    setSize(null);
    setLimit(PAGE);
  };
  const pickSize = (s: number | null) => {
    setSize(s);
    setLimit(PAGE);
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };
  const copyOne = async (key: string, hex: string) => {
    await writeText(hex.toUpperCase());
    setCopied(key);
    setTimeout(() => setCopied(null), 1000);
  };
  const copyAll = async (p: Palette) => {
    await writeText(p.colors.join(", "));
    flash(`Copied ${p.colors.length} colors`);
  };
  const save = (p: Palette) => {
    createPalette(p.name, p.colors);
    flash("Saved to My palettes");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-base)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] shrink-0 select-none">
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
        <span className="text-[11px] text-[var(--text-muted)] ml-auto">{palettes.length} palettes</span>
      </div>

      {/* Mood pills */}
      <div className="shrink-0 overflow-x-auto scrollbar-none border-b border-[var(--border)]">
        <div className="flex gap-1.5 px-4 py-2.5 w-max">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => pick(m.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors duration-100 ${
                mood === m.key
                  ? "bg-[var(--brand)] text-[var(--on-brand)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size filter */}
      <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-[var(--border)]">
        <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mr-1">Colors</span>
        <button
          onClick={() => pickSize(null)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-100 ${
            size === null ? "bg-[var(--bg-hover)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          All
        </button>
        {sizes.map((s) => (
          <button
            key={s}
            onClick={() => pickSize(s)}
            className={`w-7 h-7 rounded-md text-[11px] font-semibold transition-colors duration-100 ${
              size === s ? "bg-[var(--brand)] text-[var(--on-brand)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Palette cards — one per row, full width, footer always visible */}
      <div className="flex-1 scroll-y px-4 py-4 space-y-3">
        {shown.map((p, idx) => (
          <div key={`${p.name}-${idx}`} className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-surface)]">
            {/* Horizontal color strip */}
            <div className="flex h-16">
              {p.colors.map((hex, i) => {
                const key = `${idx}-${i}`;
                const fg = getContrastColor(hexToRgb(hex));
                return (
                  <button
                    key={key}
                    onClick={() => copyOne(key, hex)}
                    className="flex-1 relative group/band transition-all duration-150 hover:flex-[1.7]"
                    style={{ backgroundColor: hex }}
                    title={`Copy ${hex}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/band:opacity-100 transition-opacity duration-100">
                      <span className="font-mono text-[9px] font-semibold" style={{ color: fg }}>{hex}</span>
                    </span>
                    {copied === key && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke={fg}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] text-[var(--text-muted)]">{p.colors.length} colors</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copyAll(p)}
                  className="px-2 py-1 rounded-md text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
                >
                  Copy all
                </button>
                <button
                  onClick={() => save(p)}
                  title="Save to My palettes"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors duration-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
                  </svg>
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}

        {limit < palettes.length && (
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="w-full py-2.5 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors duration-100"
          >
            Load more ({palettes.length - limit} left)
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] border border-[var(--border-hover)] text-[var(--text-primary)] text-[12px] font-medium px-4 py-2 rounded-full shadow-lg shadow-black/30 animate-fade-in-up flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
