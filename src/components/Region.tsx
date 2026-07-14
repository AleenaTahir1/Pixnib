import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Point {
  cx: number; // client (for drawing)
  cy: number;
  sx: number; // physical screen (for averaging)
  sy: number;
}

/**
 * Fullscreen overlay for area picking. The user drags a rectangle; the visual
 * box uses client coords, while the averaged region uses physical cursor
 * coords fetched from the backend (so DPI scaling never has to be reconciled).
 */
export function Region() {
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<{ cx: number; cy: number } | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    document.body.style.background = "transparent";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") invoke("cancel_area_mode").catch(() => {});
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleDown = async (e: React.MouseEvent) => {
    const [sx, sy] = await invoke<[number, number]>("cursor_screen_pos");
    dragging.current = true;
    setStart({ cx: e.clientX, cy: e.clientY, sx, sy });
    setEnd({ cx: e.clientX, cy: e.clientY });
  };

  const handleMove = (e: React.MouseEvent) => {
    if (dragging.current) setEnd({ cx: e.clientX, cy: e.clientY });
  };

  const handleUp = async () => {
    if (!dragging.current || !start) return;
    dragging.current = false;
    const [ex, ey] = await invoke<[number, number]>("cursor_screen_pos");
    await invoke("pick_area", { x1: start.sx, y1: start.sy, x2: ex, y2: ey }).catch(() => {});
    setStart(null);
    setEnd(null);
  };

  const rect =
    start && end
      ? {
          left: Math.min(start.cx, end.cx),
          top: Math.min(start.cy, end.cy),
          width: Math.abs(start.cx - end.cx),
          height: Math.abs(start.cy - end.cy),
        }
      : null;

  return (
    <div
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      className="h-screen w-screen cursor-crosshair select-none"
      style={{ background: "rgba(9, 9, 11, 0.35)" }}
    >
      {!start && (
        <div className="absolute inset-x-0 top-6 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-hover)] rounded-full px-4 py-2 text-[12px] text-[var(--text-primary)] shadow-lg">
            Drag a rectangle to average its colors · <span className="text-[var(--text-muted)]">Esc to cancel</span>
          </div>
        </div>
      )}

      {rect && (
        <div
          className="absolute border-2 border-[var(--accent)] bg-[var(--accent)]/10 pointer-events-none"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        >
          <span className="absolute -top-6 left-0 bg-[var(--accent)] text-[var(--on-accent)] text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded">
            {rect.width}×{rect.height}
          </span>
        </div>
      )}
    </div>
  );
}
