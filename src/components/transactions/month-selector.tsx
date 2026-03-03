"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
];

interface MonthSelectorProps {
    month: string;  // format: "fev/26"
    onChange: (month: string) => void;
}

function parseMonth(month: string): { monthIndex: number; year: number } {
    const [m, y] = month.split("/");
    return { monthIndex: MONTHS.indexOf(m), year: parseInt(y) };
}

function formatMonth(monthIndex: number, year: number): string {
    return `${MONTHS[monthIndex]}/${String(year).padStart(2, "0")}`;
}

export function MonthSelector({ month, onChange }: MonthSelectorProps) {
    const { monthIndex, year } = parseMonth(month);

    function prev() {
        if (monthIndex === 0) {
            onChange(formatMonth(11, year - 1));
        } else {
            onChange(formatMonth(monthIndex - 1, year));
        }
    }

    function next() {
        if (monthIndex === 11) {
            onChange(formatMonth(0, year + 1));
        } else {
            onChange(formatMonth(monthIndex + 1, year));
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={prev}
                className="p-1 rounded-[4px] transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
                <ChevronLeft size={16} />
            </button>
            <span
                className="text-[13px] min-w-[60px] text-center"
                style={{ color: "var(--text-primary)", fontWeight: 500 }}
            >
                {month}
            </span>
            <button
                onClick={next}
                className="p-1 rounded-[4px] transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
