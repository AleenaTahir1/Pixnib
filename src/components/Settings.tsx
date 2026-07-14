import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { ColorFormat } from "../types/color";

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  defaultFormat: ColorFormat;
  onDefaultFormatChange: (f: ColorFormat) => void;
  onShortcutChange: (label: string) => void;
  onReplayTour: () => void;
}

const COPY_FORMATS: ColorFormat[] = ["hex", "rgb", "hsl"];

/** Slide-over settings panel: pick shortcut, launch-at-startup, default copy format. */
export function Settings({
  open,
  onClose,
  defaultFormat,
  onDefaultFormatChange,
  onShortcutChange,
  onReplayTour,
}: SettingsProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [active, setActive] = useState("");
  const [autostart, setAutostart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    invoke<string[]>("list_shortcut_options").then(setOptions).catch(() => {});
    invoke<string>("get_active_shortcut").then(setActive).catch(() => {});
    isEnabled().then(setAutostart).catch(() => {});
  }, [open]);

  const handleShortcut = async (label: string) => {
    setError(null);
    try {
      const applied = await invoke<string>("set_pick_shortcut", { label });
      setActive(applied);
      onShortcutChange(applied);
    } catch (e) {
      setError(String(e));
    }
  };

  const handleAutostart = async (next: boolean) => {
    try {
      if (next) await enable();
      else await disable();
      setAutostart(next);
    } catch (e) {
      setError(String(e));
    }
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
        <h2 className="text-[14px] font-semibold">Settings</h2>
      </div>

      <div className="flex-1 scroll-y px-4 py-4 space-y-5">
        {/* Pick shortcut */}
        <section className="space-y-2">
          <label className="text-[12px] font-medium text-[var(--text-secondary)]">Pick shortcut</label>
          <p className="text-[11px] text-[var(--text-muted)]">
            The global hotkey to start picking. If one is taken by another app, choose another.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {options.map((label) => (
              <button
                key={label}
                onClick={() => handleShortcut(label)}
                className={`px-2.5 py-2 rounded-lg border font-mono text-[11px] transition-colors duration-100 ${
                  active === label
                    ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Default copy format */}
        <section className="space-y-2">
          <label className="text-[12px] font-medium text-[var(--text-secondary)]">Default copy format</label>
          <p className="text-[11px] text-[var(--text-muted)]">Auto-copied to your clipboard when you pick a color.</p>
          <div className="flex gap-1.5">
            {COPY_FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => onDefaultFormatChange(f)}
                className={`flex-1 px-2.5 py-2 rounded-lg border text-[11px] font-medium uppercase transition-colors duration-100 ${
                  defaultFormat === f
                    ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </section>

        {/* Launch at startup */}
        <section className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-medium text-[var(--text-secondary)]">Launch at startup</div>
            <p className="text-[11px] text-[var(--text-muted)]">Run Pixnib quietly when Windows starts.</p>
          </div>
          <button
            role="switch"
            aria-checked={autostart}
            onClick={() => handleAutostart(!autostart)}
            className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${
              autostart ? "bg-[var(--accent)]" : "bg-[var(--bg-hover)]"
            }`}
          >
            <span
              className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                autostart ? "translate-x-[18px]" : ""
              }`}
            />
          </button>
        </section>

        {/* Replay tour */}
        <section className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
          <div>
            <div className="text-[12px] font-medium text-[var(--text-secondary)]">Show the intro tour</div>
            <p className="text-[11px] text-[var(--text-muted)]">Walk through what each part does again.</p>
          </div>
          <button
            onClick={onReplayTour}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] transition-colors duration-100 shrink-0"
          >
            Replay
          </button>
        </section>

        {error && (
          <p className="text-[11px] text-[var(--danger)] bg-[var(--danger-soft)] rounded-lg px-3 py-2">{error}</p>
        )}
      </div>
    </div>
  );
}
