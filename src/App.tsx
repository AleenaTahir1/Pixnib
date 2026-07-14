import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ColorHistory } from "./components/ColorHistory";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { useColorHistory } from "./hooks/useColorHistory";
import { ColorInfo, ColorEntry, ColorFormat } from "./types/color";
import { formatColor, getContrastColor } from "./utils/colorConvert";

const appWindow = getCurrentWindow();

function App() {
  const [displayColor, setDisplayColor] = useState<{ hex: string; rgb: [number, number, number] } | null>(null);
  const [format] = useState<ColorFormat>("hex");
  const [copied, setCopied] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState("");
  const {
    colors,
    isLoading,
    addColor,
    removeColor,
    updateLabel,
    clearHistory,
  } = useColorHistory();

  // Listen for color picked events
  useEffect(() => {
    const unlistenPicked = listen<ColorInfo>("color-picked", async (event) => {
      const color = event.payload;
      setDisplayColor({ hex: color.hex, rgb: color.rgb });
      await addColor(color);

      // Auto-copy to clipboard
      const text = formatColor(color.rgb, format);
      await writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });

    return () => {
      unlistenPicked.then((fn) => fn());
    };
  }, [addColor, format]);

  // Fetch the active shortcut label from backend
  useEffect(() => {
    invoke<string>("get_active_shortcut").then(setShortcutLabel).catch(() => {});
  }, []);

  // Track maximize state
  useEffect(() => {
    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handlePickColor = useCallback(async () => {
    try {
      await invoke("start_pick_mode");
    } catch (err) {
      console.error("Failed to start pick mode:", err);
    }
  }, []);

  const handleSelectFromHistory = useCallback((color: ColorEntry) => {
    setDisplayColor({ hex: color.hex, rgb: color.rgb });
  }, []);

  const handleCopyFormat = useCallback(async (f: ColorFormat) => {
    if (displayColor) {
      const text = formatColor(displayColor.rgb, f);
      await writeText(text);
      setCopiedFormat(f);
      setTimeout(() => setCopiedFormat(null), 1500);
    }
  }, [displayColor]);

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
      {/* Custom Title Bar */}
      <header
        className="flex items-center justify-between px-4 pt-3 pb-2 select-none shrink-0"
        onMouseDown={(e) => {
          // Only start dragging if clicking on the header itself, not on child buttons
          if (e.buttons === 1 && e.detail === 1 && (e.target as HTMLElement).closest('[data-window-controls]') === null) {
            appWindow.startDragging();
          }
        }}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-window-controls]') === null) {
            appWindow.toggleMaximize();
          }
        }}
      >
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5 pointer-events-none">
          <img src="/logo.svg" alt="Pixnib" className="w-7 h-7" />
          <h1 className="text-[16px] font-semibold tracking-tight">Pixnib</h1>
        </div>

        {/* Right: Window Controls */}
        <div data-window-controls className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); appWindow.minimize(); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
          >
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
              <rect width="10" height="1" rx="0.5" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); appWindow.toggleMaximize(); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
          >
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="2" y="0.5" width="7" height="7" rx="1" />
                <rect x="0.5" y="2.5" width="7" height="7" rx="1" />
              </svg>
            ) : (
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.1">
                <rect x="0.5" y="0.5" width="8" height="8" rx="1" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); appWindow.close(); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors duration-100"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M1 1l8 8M9 1l-8 8" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="px-5 pb-5 space-y-3 flex-1 overflow-y-auto">
        {/* Pick Button */}
        <button
          onClick={handlePickColor}
          className="w-full py-3.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent-border)] rounded-xl font-medium text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 group active:scale-[0.98]"
        >
          <span>Pick a Color</span>
          {shortcutLabel && (
            <span className="text-[10px] text-[var(--text-muted)] font-mono ml-1">
              {shortcutLabel}
            </span>
          )}
        </button>

        {/* Display Color */}
        {displayColor && (
          <div className="animate-fade-in-up space-y-2">
            {/* Color Swatch */}
            <div
              className="h-24 rounded-xl flex items-end p-3.5 relative overflow-hidden"
              style={{ backgroundColor: displayColor.hex }}
            >
              <span
                className="font-mono text-base font-medium"
                style={{ color: getContrastColor(displayColor.rgb) }}
              >
                {displayColor.hex}
              </span>
            </div>

            {/* All Format Values - each copyable */}
            <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
              {(["hex", "rgb", "hsl"] as ColorFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => handleCopyFormat(f)}
                  className="w-full px-3 py-2 flex items-center justify-between text-[12px] hover:bg-[var(--bg-elevated)] transition-colors duration-100 first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="text-[var(--text-muted)] font-medium uppercase text-[10px] w-8 shrink-0 text-left">{f}</span>
                  <span className="font-mono text-[var(--text-primary)] flex-1 min-w-0 truncate text-center">
                    {formatColor(displayColor.rgb, f)}
                  </span>
                  {copiedFormat === f ? (
                    <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color History */}
        <ColorHistory
          colors={colors}
          isLoading={isLoading}
          onDelete={removeColor}
          onLabelChange={updateLabel}
          onClear={clearHistory}
          onSelect={handleSelectFromHistory}
        />
      </main>

      {/* Toast */}
      {copied && (
        <div className="fixed top-4 right-4 bg-[var(--bg-elevated)] border border-[var(--accent-border)] text-[var(--text-primary)] pl-3 pr-4 py-2.5 rounded-lg shadow-lg shadow-black/20 text-[12px] font-medium animate-fade-in z-50 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          Copied to clipboard
        </div>
      )}

      {/* Update prompt */}
      <UpdatePrompt />
    </div>
  );
}

export default App;
