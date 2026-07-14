import { useEffect, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ColorHistory } from "./components/ColorHistory";
import { CodeSnippets } from "./components/CodeSnippets";
import { ContrastChecker } from "./components/ContrastChecker";
import { ShadeStrip } from "./components/ShadeStrip";
import { Settings } from "./components/Settings";
import { Palettes } from "./components/Palettes";
import { Themes } from "./components/Themes";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { useColorHistory } from "./hooks/useColorHistory";
import { ColorInfo, ColorEntry, ColorFormat } from "./types/color";
import { formatColor, getContrastColor } from "./utils/colorConvert";

const appWindow = getCurrentWindow();

function App() {
  type Swatch = { hex: string; rgb: [number, number, number] };
  const [displayColor, setDisplayColor] = useState<Swatch | null>(null);
  // The color actually picked; shades are derived from this and it stays
  // restorable even after you preview a shade.
  const [originalColor, setOriginalColor] = useState<Swatch | null>(null);
  const [format, setFormat] = useState<ColorFormat>(
    () => (localStorage.getItem("pixnib-default-format") as ColorFormat) || "hex"
  );
  const [copied, setCopied] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [palettesOpen, setPalettesOpen] = useState(false);
  const [themesOpen, setThemesOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("pixnib-theme") === "light" ? "light" : "dark")
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("pixnib-theme", next);
      return next;
    });
  }, []);

  const handleFormatChange = useCallback((f: ColorFormat) => {
    setFormat(f);
    localStorage.setItem("pixnib-default-format", f);
  }, []);
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
      setOriginalColor({ hex: color.hex, rgb: color.rgb });
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

  const handlePickArea = useCallback(async () => {
    try {
      await invoke("start_area_mode");
    } catch (err) {
      console.error("Failed to start area mode:", err);
    }
  }, []);

  const handleSelectFromHistory = useCallback((color: ColorEntry) => {
    setDisplayColor({ hex: color.hex, rgb: color.rgb });
    setOriginalColor({ hex: color.hex, rgb: color.rgb });
  }, []);

  // Preview a generated shade as the current color without losing the original
  const handleApplyShade = useCallback(async (hex: string, rgb: [number, number, number]) => {
    setDisplayColor({ hex, rgb });
    await writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleRestoreOriginal = useCallback(() => {
    if (originalColor) setDisplayColor(originalColor);
  }, [originalColor]);

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

        {/* Right: app actions + window controls */}
        <div data-window-controls className="flex items-center gap-0.5">
          {/* Curated themes */}
          <button
            onClick={(e) => { e.stopPropagation(); setThemesOpen(true); }}
            title="Theme palettes"
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <rect x="3" y="4" width="18" height="4" rx="1.2" />
              <rect x="3" y="10" width="18" height="4" rx="1.2" />
              <rect x="3" y="16" width="18" height="4" rx="1.2" />
            </svg>
          </button>
          {/* My palettes */}
          <button
            onClick={(e) => { e.stopPropagation(); setPalettesOpen(true); }}
            title="My palettes"
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.39-.61-.39-1 0-.83.67-1.5 1.5-1.5H16a5 5 0 005-5c0-4.42-4.03-8-9-8z" />
              <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
              <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
              <circle cx="16.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </button>
          {/* Theme toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                <circle cx="12" cy="12" r="4" />
                <path strokeLinecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            )}
          </button>
          {/* Settings */}
          <button
            onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }}
            title="Settings"
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          {/* Divider */}
          <div className="w-px h-4 bg-[var(--border-hover)] mx-1" />
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
      <main className="px-5 pb-5 space-y-3 flex-1 scroll-y">
        {/* Pick actions */}
        <div className="flex gap-2">
          <button
            onClick={handlePickColor}
            className="flex-1 py-3.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent-border)] rounded-xl font-medium text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 group active:scale-[0.98]"
          >
            <span>Pick a Color</span>
            {shortcutLabel && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono ml-1">
                {shortcutLabel}
              </span>
            )}
          </button>
          <button
            onClick={handlePickArea}
            title="Average a region"
            className="px-3.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent-border)] rounded-xl transition-all duration-200 flex items-center justify-center active:scale-[0.98] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </button>
        </div>

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

            {/* Dev code snippets */}
            <CodeSnippets rgb={displayColor.rgb} />

            {/* Shades & tints */}
            {originalColor && (
              <ShadeStrip
                original={originalColor.rgb}
                activeHex={displayColor.hex}
                onApply={handleApplyShade}
                onRestore={handleRestoreOriginal}
              />
            )}
          </div>
        )}

        {/* Contrast checker */}
        <ContrastChecker current={displayColor?.hex ?? null} history={colors} />

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

      {/* Settings */}
      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        defaultFormat={format}
        onDefaultFormatChange={handleFormatChange}
        onShortcutChange={setShortcutLabel}
      />

      {/* Palettes */}
      <Palettes
        open={palettesOpen}
        onClose={() => setPalettesOpen(false)}
        current={displayColor?.hex ?? null}
      />

      {/* Curated theme palettes */}
      <Themes open={themesOpen} onClose={() => setThemesOpen(false)} />

      {/* Update prompt */}
      <UpdatePrompt />
    </div>
  );
}

export default App;
