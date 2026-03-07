"use client";

import { useState } from "react";
import { getCategoryColor } from "@/lib/category-colors";
import { ALL_CATEGORIES } from "@/lib/category-colors";
import { CATEGORY_TAXONOMY } from "@/lib/categories";
import { ChevronRight } from "lucide-react";

interface CategoryBadgeProps {
    category: string;
    subcategory?: string | null;
    confidence?: "high" | "low" | "manual" | null;
    onClick?: () => void;
}

export function CategoryBadge({ category, subcategory, confidence, onClick }: CategoryBadgeProps) {
    const colors = getCategoryColor(category);

    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[4px] text-[11px] transition-colors"
            style={{ background: colors.bg, color: colors.text }}
            title={subcategory ? `${category} › ${subcategory}` : category}
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
    currentSubcategory?: string | null;
    onSelect: (category: string, subcategory?: string) => void;
    onClose: () => void;
}

export function CategoryPicker({ current, currentSubcategory, onSelect, onClose }: CategoryPickerProps) {
    const [expandedCat, setExpandedCat] = useState<string | null>(null);

    return (
        <div
            className="absolute z-50 mt-1 rounded-[6px] border py-1 min-w-[200px] max-h-[360px] overflow-y-auto"
            style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
            }}
        >
            {ALL_CATEGORIES.map((cat) => {
                const isActive = cat === current;
                const colors = getCategoryColor(cat);
                const subs = CATEGORY_TAXONOMY[cat]?.subcategories || [];
                const isExpanded = expandedCat === cat;

                return (
                    <div key={cat}>
                        <button
                            onClick={() => {
                                if (subs.length > 0) {
                                    setExpandedCat(isExpanded ? null : cat);
                                } else {
                                    onSelect(cat);
                                    onClose();
                                }
                            }}
                            className="w-full text-left px-3 py-[6px] text-[13px] flex items-center gap-2 transition-colors"
                            style={{
                                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                background: isExpanded ? "var(--bg-surface)" : isActive ? "var(--bg-surface)" : "transparent",
                                fontWeight: isActive ? 500 : 400,
                            }}
                        >
                            <span
                                className="w-[6px] h-[6px] rounded-full shrink-0"
                                style={{ background: colors.dot }}
                            />
                            <span className="flex-1 truncate">{cat}</span>
                            {subs.length > 0 && (
                                <ChevronRight
                                    size={12}
                                    className="shrink-0 transition-transform"
                                    style={{
                                        color: "var(--text-muted)",
                                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                    }}
                                />
                            )}
                            {isActive && !isExpanded && (
                                <span className="shrink-0" style={{ color: "var(--accent-green)", fontSize: 10 }}>●</span>
                            )}
                        </button>

                        {/* Subcategories — expanded inline */}
                        {isExpanded && subs.length > 0 && (
                            <div
                                className="py-1"
                                style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
                            >
                                {/* Option: select category without subcategory */}
                                <button
                                    onClick={() => { onSelect(cat); onClose(); }}
                                    className="w-full text-left pl-7 pr-3 py-[5px] text-[12px] flex items-center gap-2 transition-colors"
                                    style={{
                                        color: isActive && !currentSubcategory ? "var(--text-primary)" : "var(--text-muted)",
                                        background: "transparent",
                                        fontStyle: "italic",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                >
                                    {cat} (geral)
                                    {isActive && !currentSubcategory && (
                                        <span className="ml-auto" style={{ color: "var(--accent-green)", fontSize: 10 }}>●</span>
                                    )}
                                </button>
                                {subs.map((sub) => {
                                    const isSubActive = isActive && currentSubcategory === sub;
                                    return (
                                        <button
                                            key={sub}
                                            onClick={() => { onSelect(cat, sub); onClose(); }}
                                            className="w-full text-left pl-7 pr-3 py-[5px] text-[12px] flex items-center gap-2 transition-colors"
                                            style={{
                                                color: isSubActive ? "var(--text-primary)" : "var(--text-secondary)",
                                                background: "transparent",
                                                fontWeight: isSubActive ? 500 : 400,
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                        >
                                            <span
                                                className="w-[4px] h-[4px] rounded-full shrink-0"
                                                style={{ background: colors.dot, opacity: 0.5 }}
                                            />
                                            <span className="flex-1 truncate">{sub}</span>
                                            {isSubActive && (
                                                <span className="shrink-0" style={{ color: "var(--accent-green)", fontSize: 10 }}>●</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
