"use client";

import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from "recharts";
import type { ChartSpec } from "@/lib/chart-types";
import { CHART_COLORS } from "@/lib/category-colors";

interface InlineChartProps {
    spec: ChartSpec;
}

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-[6px] border px-3 py-2 text-caption"
            style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
            }}
        >
            {label && <p className="mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>}
            {payload.map((item, i) => (
                <p key={i} style={{ color: item.color || "var(--text-primary)" }}>
                    {item.name}: <strong>R$ {Number(item.value).toLocaleString("pt-BR")}</strong>
                </p>
            ))}
        </div>
    );
}

export function InlineChart({ spec }: InlineChartProps) {
    const { type, title, data, xKey, yKey, color, series } = spec;
    const mainColor = color || CHART_COLORS[0];

    return (
        <div
            className="rounded-[6px] border p-4"
            style={{ borderColor: "var(--border)" }}
        >
            {title && (
                <p className="text-caption mb-4" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                    {title}
                </p>
            )}

            <ResponsiveContainer width="100%" height={260}>
                {type === "bar" ? (
                    <BarChart data={data}>
                        <CartesianGrid
                            stroke="var(--border)"
                            strokeDasharray="3 3"
                            vertical={false}
                        />
                        <XAxis
                            dataKey={xKey}
                            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                            axisLine={{ stroke: "var(--border)" }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<ChartTooltipContent />} />
                        {series ? (
                            series.map((s) => (
                                <Bar
                                    key={s.key}
                                    dataKey={s.key}
                                    fill={s.color}
                                    name={s.label}
                                    barSize={24}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))
                        ) : (
                            <Bar
                                dataKey={yKey}
                                fill={mainColor}
                                barSize={24}
                                radius={[4, 4, 0, 0]}
                            />
                        )}
                    </BarChart>
                ) : type === "line" ? (
                    <LineChart data={data}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={xKey} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
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
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={xKey} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltipContent />} />
                        {series ? (
                            series.map((s) => (
                                <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} fill={s.color} fillOpacity={0.15} name={s.label} strokeWidth={2} />
                            ))
                        ) : (
                            <Area type="monotone" dataKey={yKey} stroke={mainColor} fill={mainColor} fillOpacity={0.15} strokeWidth={2} />
                        )}
                    </AreaChart>
                ) : type === "pie" ? (
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={yKey}
                            nameKey={xKey}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend
                            verticalAlign="bottom"
                            formatter={(value: string) => (
                                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>
                            )}
                        />
                    </PieChart>
                ) : null}
            </ResponsiveContainer>
        </div>
    );
}
