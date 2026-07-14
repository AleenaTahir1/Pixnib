import { useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { codeFormats } from "../utils/codeFormats";

/** Collapsible "copy as code" list for the currently displayed color. */
export function CodeSnippets({ rgb }: { rgb: [number, number, number] }) {
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, code: string) => {
    await writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-100"
      >
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          Copy as code
        </span>
        <svg
          className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-[var(--border)] border-t border-[var(--border)] animate-fade-in">
          {codeFormats(rgb).map(({ key, label, code }) => (
            <button
              key={key}
              onClick={() => handleCopy(key, code)}
              className="w-full px-3 py-2 flex items-center justify-between gap-2 text-[12px] hover:bg-[var(--bg-elevated)] transition-colors duration-100 last:rounded-b-lg"
            >
              <span className="text-[var(--text-muted)] font-medium text-[10px] w-14 shrink-0 text-left">
                {label}
              </span>
              <span className="font-mono text-[11px] text-[var(--text-primary)] flex-1 min-w-0 truncate text-right">
                {code}
              </span>
              {copiedKey === key ? (
                <svg className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
