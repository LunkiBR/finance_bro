"use client";

import { getCategoryColor } from "@/lib/category-colors";
import { ALL_CATEGORIES } from "@/lib/category-colors";

interface CategoryBadgeProps {
    category: string;
    confidence?: "high" | "low" | "manual" | null;
    onClick?: () => void;
}

export function CategoryBadge({ category, confidence, onClick }: CategoryBadgeProps) {
    const colors = getCategoryColor(category);

    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[4px] text-[11px] transition-colors"
            style={{ background: colors.bg, color: colors.text }}
        >
            {confidence === "low" && (
                <span style={{ color: "var(--accent-amber)" }}>?</span>
            )}
            {category}
        </button>
    );
}

interface CategoryPickerProps {
    current: string;
    onSelect: (category: string) => void;
    onClose: () => void;
}

export function CategoryPicker({ current, onSelect, onClose }: CategoryPickerProps) {
    return (
        <div
            className="absolute z-50 mt-1 rounded-[6px] border py-1 min-w-[160px]"
            style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
            }}
        >
            {ALL_CATEGORIES.map((cat) => {
                const isActive = cat === current;
                const colors = getCategoryColor(cat);
                return (
                    <button
                        key={cat}
                        onClick={() => { onSelect(cat); onClose(); }}
                        className="w-full text-left px-3 py-[6px] text-[13px] flex items-center gap-2 transition-colors"
                        style={{
                            color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                            background: isActive ? "var(--bg-surface)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = "var(--bg-surface)";
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <span
                            className="w-[6px] h-[6px] rounded-full"
                            style={{ background: colors.dot }}
                        />
                        {cat}
                        {isActive && <span className="ml-auto" style={{ color: "var(--accent-green)" }}>●</span>}
                    </button>
                );
            })}
        </div>
    );
}
