import { useEffect, useRef, useState } from "react";
import { ColorEntry } from "../types/color";
import { contrastRatio, hexToRgb, wcagLevels } from "../utils/contrast";

interface ContrastCheckerProps {
  /** Hex of the currently displayed color; tracks into the text slot until overridden. */
  current: string | null;
  history: ColorEntry[];
}

/**
 * WCAG contrast panel: a text/background color pair with live ratio and
 * AA/AAA badges. Click a slot to arm it, then tap a swatch to assign.
 */
export function ContrastChecker({ current, history }: ContrastCheckerProps) {
  const [fg, setFg] = useState("#FFFFFF");
  const [bg, setBg] = useState("#09090B");
  const [armed, setArmed] = useState<"fg" | "bg">("bg");
  const fgTouched = useRef(false);

  // The text slot follows freshly picked colors until manually assigned
  useEffect(() => {
    if (current && !fgTouched.current) setFg(current.toUpperCase());
  }, [current]);

  const assign = (hex: string) => {
    if (armed === "fg") {
      fgTouched.current = true;
      setFg(hex.toUpperCase());
    } else {
      setBg(hex.toUpperCase());
    }
  };

  const ratio = contrastRatio(hexToRgb(fg), hexToRgb(bg));
  const levels = wcagLevels(ratio);
  const swatches = [
    "#FFFFFF",
    "#000000",
    ...history.slice(0, 8).map((c) => c.hex.toUpperCase()),
  ].filter((hex, i, arr) => arr.indexOf(hex) === i);

  // Plain-language verdict, so the ratio number means something at a glance.
  const verdict = levels.aaaNormal
    ? { text: "Excellent. Readable at any text size.", tone: "good" }
    : levels.aaNormal
      ? { text: "Good for body text.", tone: "good" }
      : levels.aaLarge
        ? { text: "OK for large text only (18pt+ or bold).", tone: "warn" }
        : { text: "Low contrast, hard to read.", tone: "bad" };

  const slot = (kind: "fg" | "bg", hex: string, label: string) => (
    <button
      onClick={() => setArmed(kind)}
      className={`flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors duration-100 ${
        armed === kind
          ? "border-[var(--accent-border)] bg-[var(--bg-elevated)]"
          : "border-[var(--border)] hover:border-[var(--border-hover)]"
      }`}
    >
      <div
        className="w-5 h-5 rounded-md border border-[var(--border-hover)] shrink-0"
        style={{ backgroundColor: hex }}
      />
      <div className="min-w-0 text-left">
        <div className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
        <div className="font-mono text-[10px] text-[var(--text-secondary)] truncate">{hex}</div>
      </div>
    </button>
  );

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-3 space-y-2.5">
      {/* Live preview */}
          <div
            className="h-14 rounded-lg flex items-center justify-between px-3.5 border border-[var(--border)]"
            style={{ backgroundColor: bg }}
          >
            <span className="text-[17px] font-semibold" style={{ color: fg }}>
              Aa
            </span>
            <span className="font-mono text-[13px]" style={{ color: fg }}>
              {ratio.toFixed(2)}:1
            </span>
          </div>

          {/* Slots */}
          <div className="flex items-center gap-1.5">
            {slot("fg", fg, "Text")}
            <button
              onClick={() => {
                fgTouched.current = true;
                setFg(bg);
                setBg(fg);
              }}
              title="Swap"
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors duration-100 shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </button>
            {slot("bg", bg, "Back")}
          </div>

          {/* Assign swatches */}
          <div className="flex gap-1.5 flex-wrap">
            {swatches.map((hex) => (
              <button
                key={hex}
                title={`Set ${armed === "fg" ? "text" : "background"} to ${hex}`}
                onClick={() => assign(hex)}
                className="w-6 h-6 rounded-md border border-[var(--border-hover)] hover:scale-110 transition-transform duration-100"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>

          {/* Plain verdict */}
          <div
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium ${
              verdict.tone === "good"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : verdict.tone === "warn"
                  ? "bg-[#fcd34d]/10 text-[#e0a83a]"
                  : "bg-[var(--danger-soft)] text-[var(--danger)]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                verdict.tone === "good"
                  ? "bg-[var(--accent)]"
                  : verdict.tone === "warn"
                    ? "bg-[#e0a83a]"
                    : "bg-[var(--danger)]"
              }`}
            />
            {verdict.text}
          </div>
    </div>
  );
}
