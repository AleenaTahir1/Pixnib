import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { LoupeData } from "../types/color";

const GRID = 11;
const POLL_MS = 50;

/**
 * Content of the small always-on-top loupe window that follows the cursor
 * during pick mode. The backend moves the window; this component only polls
 * the pixel grid and renders it. Polling runs solely between
 * pick-mode-started and pick-mode-stopped/color-picked events.
 */
export function Loupe() {
  const [data, setData] = useState<LoupeData | null>(null);

  useEffect(() => {
    // The window itself is transparent so our rounded corners show
    document.body.style.background = "transparent";

    let timer: number | null = null;
    const start = () => {
      if (timer !== null) return;
      timer = window.setInterval(async () => {
        try {
          setData(await invoke<LoupeData>("capture_loupe", { grid: GRID }));
        } catch {
          // Transient capture failure (e.g. secure desktop) — keep last frame
        }
      }, POLL_MS);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      setData(null);
    };

    const unlisteners = [
      listen("pick-mode-started", start),
      listen("pick-mode-stopped", stop),
      listen("color-picked", stop),
    ];
    return () => {
      stop();
      unlisteners.forEach((u) => u.then((fn) => fn()));
    };
  }, []);

  const center = Math.floor((GRID * GRID) / 2);

  return (
    <div className="h-screen w-screen overflow-hidden rounded-xl border border-[var(--border-hover)] bg-[var(--bg-base)] flex flex-col select-none">
      <div
        className="grid flex-1 gap-px bg-[var(--bg-base)] p-1"
        style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}
      >
        {(data?.colors ?? Array(GRID * GRID).fill("#131316")).map((hex, i) => (
          <div
            key={i}
            className={i === center ? "outline outline-1 outline-white z-10 rounded-[1px]" : ""}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
      <div className="h-7 shrink-0 flex items-center justify-center gap-1.5 bg-[var(--bg-elevated)] border-t border-[var(--border)]">
        <div
          className="w-2.5 h-2.5 rounded-full border border-[var(--border-hover)]"
          style={{ backgroundColor: data?.hex ?? "transparent" }}
        />
        <span className="font-mono text-[11px] text-[var(--text-primary)]">
          {data?.hex ?? "…"}
        </span>
      </div>
    </div>
  );
}
