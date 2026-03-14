"use client";

import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer,
} from "recharts";
import type { ChartSpec } from "@/lib/chart-types";

interface InlineChartProps {
    spec: ChartSpec;
    /** When true, renders monochromatic donut: top slice gets accent color, rest in gray shades */
    monoDonut?: boolean;
    /** When true, intensifies despesas gradient fill (expenses > income warning) */
    areaWarning?: boolean;
}

// Monochromatic palette: index 0 = vibrant blue, rest = gray shades
const MONO_COLORS = ["#3B82F6", "#2563EB", "#4D5260", "#3A3F4A", "#2A2D35", "#1E2025", "#17181C"];
// Fallback multi-color for non-mono mode
const CHART_COLORS = ["#3B82F6", "#7C3AED", "#F59E0B", "#00A67E", "#E5484D", "#6B7280", "#10B981"];

function ChartTooltipContent({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-[6px] border px-3 py-2 text-caption"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
            {label && <p className="mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>}
            {payload.map((item, i) => (
                <p key={i} style={{ color: item.color || "var(--text-primary)" }}>
                    {item.name}: <strong>R$ {Number(item.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </p>
            ))}
        </div>
    );
}

export function InlineChart({ spec, monoDonut = false, areaWarning = false }: InlineChartProps) {
    const { type, title, data, xKey, yKey, color, series } = spec;
    const mainColor = color || "#3B82F6";

    const despesasFillOpacity = areaWarning ? 0.22 : 0.10;

    return (
        <div className="rounded-[6px] border p-4" style={{ borderColor: "var(--border)" }}>
            {title && (
                <p className="text-caption mb-4" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                    {title}
                </p>
            )}

            <ResponsiveContainer width="100%" height={240}>
                {type === "bar" ? (
                    <BarChart data={data} barCategoryGap="30%">
                        <XAxis
                            dataKey={xKey}
                            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                            axisLine={{ stroke: "var(--border)" }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                        />
                        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        {series ? (
                            series.map((s) => (
                                <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.label} barSize={20} radius={[3, 3, 0, 0]} />
                            ))
                        ) : (
                            <Bar dataKey={yKey} fill={mainColor} barSize={20} radius={[3, 3, 0, 0]} />
                        )}
                    </BarChart>
                ) : type === "line" ? (
                    <LineChart data={data}>
                        <XAxis dataKey={xKey} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                        <Tooltip content={<ChartTooltipContent />} />
                        {series ? (
                            series.map((s) => (
                                <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} name={s.label} strokeWidth={2} dot={false} />
                            ))
                        ) : (
                            <Line type="monotone" dataKey={yKey} stroke={mainColor} strokeWidth={2} dot={false} />
                        )}
                    </LineChart>
                ) : type === "area" ? (
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E5484D" stopOpacity={despesasFillOpacity} />
                                <stop offset="95%" stopColor="#E5484D" stopOpacity={0.01} />
                            </linearGradient>
                            <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00A67E" stopOpacity={0.12} />
                                <stop offset="95%" stopColor="#00A67E" stopOpacity={0.01} />
                            </linearGradient>
                            <linearGradient id="gradMain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={mainColor} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={mainColor} stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey={xKey} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                        <Tooltip content={<ChartTooltipContent />} />
                        {series ? (
                            series.map((s) => {
                                const gradId = s.key === "despesas" ? "gradDespesas" : s.key === "receitas" ? "gradReceitas" : "gradMain";
                                return (
                                    <Area
                                        key={s.key}
                                        type="monotone"
                                        dataKey={s.key}
                                        stroke={s.color}
                                        fill={`url(#${gradId})`}
                                        name={s.label}
                                        strokeWidth={1.5}
                                    />
                                );
                            })
                        ) : (
                            <Area type="monotone" dataKey={yKey} stroke={mainColor} fill="url(#gradMain)" strokeWidth={1.5} />
                        )}
                    </AreaChart>
                ) : type === "pie" ? (
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={yKey}
                            nameKey={xKey}
                            cx="50%"
                            cy="45%"
                            innerRadius={52}
                            outerRadius={85}
                            paddingAngle={2}
                            strokeWidth={0}
                        >
                            {data.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={
                                        monoDonut
                                            ? MONO_COLORS[Math.min(i, MONO_COLORS.length - 1)]
                                            : CHART_COLORS[i % CHART_COLORS.length]
                                    }
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                    </PieChart>
                ) : null}
            </ResponsiveContainer>

            {/* Custom legend for pie/donut — text-only, no colored squares */}
            {type === "pie" && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 justify-center">
                    {data.slice(0, 6).map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div
                                className="w-[7px] h-[7px] rounded-full shrink-0"
                                style={{
                                    background: monoDonut
                                        ? MONO_COLORS[Math.min(i, MONO_COLORS.length - 1)]
                                        : CHART_COLORS[i % CHART_COLORS.length]
                                }}
                            />
                            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                                {String((d as Record<string, unknown>)[xKey] ?? "")}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
