"use client";

import { useState } from "react";
import { ICON_PICKER_OPTIONS } from "@/lib/icon-picker-options";
import * as LucideIcons from "lucide-react";

interface IconPickerProps {
  selected: string;
  onSelect: (iconName: string) => void;
  color?: string;
}

export function IconPicker({ selected, onSelect, color = "var(--text-primary)" }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const SelectedIcon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[selected] || LucideIcons.Tag;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-[6px] border text-[13px] transition-colors"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-surface)",
          color: "var(--text-secondary)",
        }}
      >
        <SelectedIcon size={16} style={{ color }} />
        <span>{selected}</span>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 rounded-[8px] border p-3 w-[320px] max-h-[360px] overflow-y-auto"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          {ICON_PICKER_OPTIONS.map((group) => (
            <div key={group.group} className="mb-3">
              <div
                className="text-[11px] font-medium mb-1.5 px-1"
                style={{ color: "var(--text-muted)" }}
              >
                {group.group}
              </div>
              <div className="flex flex-wrap gap-1">
                {group.icons.map((iconName) => {
                  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[iconName];
                  if (!Icon) return null;
                  const isSelected = iconName === selected;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        onSelect(iconName);
                        setOpen(false);
                      }}
                      className="p-1.5 rounded-[4px] transition-colors"
                      style={{
                        background: isSelected ? "var(--bg-surface)" : "transparent",
                        border: isSelected ? "1px solid var(--border)" : "1px solid transparent",
                      }}
                      title={iconName}
                    >
                      <Icon
                        size={18}
                        style={{
                          color: isSelected ? color : "var(--text-secondary)",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
