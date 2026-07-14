import { generateScale, rgbToHex } from "../utils/colorConvert";
import { hexToRgb } from "../utils/contrast";

interface ShadeStripProps {
  /** The originally picked color; the scale is always derived from this. */
  original: [number, number, number];
  /** Hex currently shown in the main swatch, to highlight the active step. */
  activeHex: string;
  onApply: (hex: string, rgb: [number, number, number]) => void;
  onRestore: () => void;
}

/**
 * Tint→shade scale of the picked color. The original sits in its own labeled
 * slot, clearly separated from the generated steps, so it is always one tap
 * away no matter which shade you are previewing.
 */
export function ShadeStrip({ original, activeHex, onApply, onRestore }: ShadeStripProps) {
  const shades = generateScale(original);
  const originalHex = rgbToHex(original);
  const active = activeHex.toUpperCase();
  const onOriginal = active === originalHex;

  return (
    <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border)] px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Shades &amp; tints
        </span>
        {!onOriginal && (
          <button
            onClick={onRestore}
            className="flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity duration-100"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Original
          </button>
        )}
      </div>

      <div className="flex items-stretch gap-2 h-9">
        {/* Original slot, kept separate from the scale */}
        <button
          title={`Original ${originalHex}`}
          onClick={onRestore}
          className={`w-9 shrink-0 rounded-md relative transition-transform duration-100 hover:scale-105 ${
            onOriginal ? "ring-2 ring-white ring-offset-1 ring-offset-[var(--bg-surface)]" : "border border-[var(--border-hover)]"
          }`}
          style={{ backgroundColor: originalHex }}
        >
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-[#06302a] text-[8px] font-bold flex items-center justify-center">
            ★
          </span>
        </button>

        <div className="w-px bg-[var(--border-hover)] shrink-0" />

        {/* Generated scale */}
        <div className="flex flex-1 rounded-md overflow-hidden">
          {shades.map((hex) => {
            const isActive = hex.toUpperCase() === active;
            return (
              <button
                key={hex}
                title={`${hex} · click to apply`}
                onClick={() => onApply(hex, hexToRgb(hex))}
                className={`flex-1 relative transition-all duration-150 hover:flex-[1.6] focus-visible:flex-[1.6] ${
                  isActive ? "flex-[1.6] z-10 ring-2 ring-white ring-inset" : ""
                }`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
