"use client";

import { useState } from "react";

const COLOR_PRESETS = [
  "#8B5CF6", "#F59E0B", "#3B82F6", "#64748B",
  "#E5484D", "#06B6D4", "#0EA5E9", "#00A67E",
  "#EC4899", "#F97316", "#6366F1", "#78716C",
  "#DC2626", "#22C55E", "#14B8A6", "#A855F7",
];

interface ColorPickerProps {
  selected: string;
  onSelect: (color: string) => void;
}

/** Gera bg (rgba 14%) e text (hex escurecido) a partir de uma cor dot. */
export function deriveColors(dotColor: string) {
  // Parse hex to RGB
  const hex = dotColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.14)`,
    text: `#${Math.max(0, r - 30).toString(16).padStart(2, "0")}${Math.max(0, g - 30).toString(16).padStart(2, "0")}${Math.max(0, b - 30).toString(16).padStart(2, "0")}`,
    dot: dotColor,
  };
}

export function ColorPicker({ selected, onSelect }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customHex, setCustomHex] = useState(selected);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            className="w-7 h-7 rounded-full border-2 transition-transform"
            style={{
              background: color,
              borderColor: selected === color ? "var(--text-primary)" : "transparent",
              transform: selected === color ? "scale(1.15)" : "scale(1)",
            }}
            title={color}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px]"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-surface)",
            color: "var(--text-muted)",
          }}
          title="Cor personalizada"
        >
          +
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="color"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0"
          />
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#FF6B35"
            className="flex-1 px-2 py-1 rounded-[4px] border text-[13px] font-mono"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (/^#[0-9a-fA-F]{6}$/.test(customHex)) {
                onSelect(customHex);
                setShowCustom(false);
              }
            }}
            className="px-2 py-1 rounded-[4px] text-[12px]"
            style={{
              background: "var(--accent-blue)",
              color: "#fff",
            }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
