"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    List,
    MessageSquare,
    PieChart,
    MoreHorizontal,
    Target,
    Bell,
    Upload,
    Settings,
    Zap,
    Tags,
    X,
    BookOpen,
} from "lucide-react";
import { useState, useEffect } from "react";

const mainItems = [
    { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { href: "/transacoes", label: "Transações",  icon: List },
    { href: "/copiloto",   label: "Copiloto",    icon: MessageSquare, primary: true },
    { href: "/importar",   label: "Importar",    icon: Upload },
];

const moreItems = [
    { href: "/categorias",    label: "Categorias",   icon: Tags },
    { href: "/orcamentos",    label: "Orçamentos",   icon: PieChart },
    { href: "/metas",         label: "Metas",         icon: Target },
    { href: "/automacoes",    label: "Automações",    icon: Zap },
    { href: "/alertas",       label: "Alertas",       icon: Bell, badge: true },
    { href: "/configuracoes", label: "Configurações", icon: Settings },
    { href: "/bem-vindo",     label: "Como usar",     icon: BookOpen },
];

export function MobileNav() {
    const pathname = usePathname();
    const [alertCount, setAlertCount] = useState(0);
    const [moreOpen, setMoreOpen] = useState(false);

    useEffect(() => {
        fetch("/api/alerts")
            .then((r) => r.json())
            .then((d) => setAlertCount(Array.isArray(d?.active) ? d.active.length : 0))
            .catch(() => setAlertCount(0));
    }, [pathname]);

    // Close sheet on route change
    useEffect(() => { setMoreOpen(false); }, [pathname]);

    const moreIsActive = moreItems.some(
        (i) => pathname === i.href || pathname.startsWith(i.href + "/")
    );
    const moreAlerts = alertCount > 0;

    return (
        <>
            {/* Overlay */}
            {moreOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 animate-fade-in"
                    style={{ background: "rgba(0,0,0,0.4)" }}
                    onClick={() => setMoreOpen(false)}
                />
            )}

            {/* More sheet */}
            {moreOpen && (
                <div
                    className="md:hidden fixed left-0 right-0 z-50 rounded-t-2xl border-t px-4 pt-4 pb-6 animate-sheet-up"
                    style={{
                        bottom: "calc(57px + env(safe-area-inset-bottom))",
                        background: "var(--bg-surface)",
                        borderColor: "var(--border)",
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                            Mais
                        </span>
                        <button onClick={() => setMoreOpen(false)} style={{ color: "var(--text-muted)" }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {moreItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl relative transition-colors active:scale-95"
                                    style={{
                                        background: isActive ? "var(--bg-elevated)" : "var(--bg-elevated)",
                                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                    }}
                                >
                                    <item.icon size={20} />
                                    <span className="text-[11px] font-medium">{item.label}</span>
                                    {item.badge && alertCount > 0 && (
                                        <span
                                            className="absolute top-2 right-4 flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-0.5"
                                            style={{ background: "var(--accent-amber)", color: "#000" }}
                                        >
                                            {alertCount > 9 ? "9+" : alertCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bottom tab bar */}
            <nav
                className="md:hidden flex-shrink-0 flex items-stretch border-t"
                style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border)",
                    paddingBottom: "env(safe-area-inset-bottom)",
                    height: "calc(57px + env(safe-area-inset-bottom))",
                }}
            >
                {mainItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                    if (item.primary) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center flex-1 gap-0.5 relative"
                            >
                                <div
                                    className="w-11 h-11 rounded-full flex items-center justify-center -mt-5 shadow-lg transition-transform active:scale-95"
                                    style={{
                                        background: isActive ? "var(--bg-elevated)" : "var(--accent-purple)",
                                        border: "3px solid var(--bg-base)",
                                        color: isActive ? "var(--accent-purple)" : "#fff",
                                    }}
                                >
                                    <item.icon size={20} />
                                </div>
                                <span
                                    className="text-[10px] font-medium"
                                    style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors active:scale-95"
                            style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
                        >
                            <div
                                className="flex items-center justify-center w-8 h-8 rounded-full"
                                style={{ background: isActive ? "var(--bg-elevated)" : "transparent" }}
                            >
                                <item.icon size={18} />
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}

                {/* "Mais" button */}
                <button
                    onClick={() => setMoreOpen((v) => !v)}
                    className="flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors active:scale-95"
                    style={{ color: moreIsActive || moreOpen ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                    <div
                        className="flex items-center justify-center w-8 h-8 rounded-full relative"
                        style={{ background: moreIsActive || moreOpen ? "var(--bg-elevated)" : "transparent" }}
                    >
                        <MoreHorizontal size={18} />
                        {moreAlerts && (
                            <span
                                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                                style={{ background: "var(--accent-amber)" }}
                            />
                        )}
                    </div>
                    <span className="text-[10px] font-medium">Mais</span>
                </button>
            </nav>
        </>
    );
}
