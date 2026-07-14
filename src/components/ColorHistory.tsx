import { ColorEntry } from "../types/color";
import { ColorCard } from "./ColorCard";

interface ColorHistoryProps {
  colors: ColorEntry[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
  onClear: () => void;
  onSelect?: (color: ColorEntry) => void;
}

export function ColorHistory({
  colors,
  isLoading,
  onDelete,
  onClear,
  onSelect,
}: ColorHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-5 h-5 border-[1.5px] border-[var(--text-muted)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (colors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
        <div className="flex gap-1.5 mb-4">
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(94, 234, 212, 0.2)' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(94, 234, 212, 0.12)' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(94, 234, 212, 0.06)' }} />
        </div>
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">No colors yet</p>
        <p className="text-[11px] mt-1">Pick your first color to begin</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--text-muted)] font-medium">
          History
          <span className="ml-1.5 opacity-60">{colors.length}</span>
        </span>
        <button
          onClick={onClear}
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors duration-150"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(42px,1fr))] gap-2">
        {colors.map((color) => (
          <ColorCard
            key={color.id}
            color={color}
            onDelete={onDelete}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
