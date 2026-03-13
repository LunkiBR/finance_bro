"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
    MessageSquare,
    LayoutDashboard,
    List,
    PieChart,
    Target,
    Bell,
    Upload,
    Settings,
    Plus,
    Diamond,
    LogOut,
    Zap,
} from "lucide-react";

const navItems = [
    { href: "/copiloto", label: "Copiloto", icon: MessageSquare },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transacoes", label: "Transações", icon: List },
    { href: "/orcamentos", label: "Orçamentos", icon: PieChart },
    { href: "/metas", label: "Metas", icon: Target },
    { href: "/automacoes", label: "Automações", icon: Zap },
    { href: "/alertas", label: "Alertas", icon: Bell, badge: true },
    { href: "/importar", label: "Importar", icon: Upload },
];

export function Sidebar() {
    const pathname = usePathname();
    const [alertCount, setAlertCount] = useState(0);
    const { data: session } = useSession();

    const userName = session?.user?.name || "Usuário";
    const userInitial = userName[0]?.toUpperCase() || "U";

    useEffect(() => {
        fetch("/api/alerts")
            .then((r) => r.json())
            .then((d) => {
                setAlertCount(Array.isArray(d?.active) ? d.active.length : 0);
            })
            .catch(() => setAlertCount(0));
    }, [pathname]);

    return (
        <aside
            className="flex flex-col h-screen w-[220px] shrink-0 border-r"
            style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 h-[52px]">
                <Diamond size={18} style={{ color: "var(--text-primary)" }} />
                <span
                    className="text-h3"
                    style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 590 }}
                >
                    Finance Friend
                </span>
            </div>

            {/* Nova conversa */}
            <div className="px-3 mb-2">
                <Link
                    href="/copiloto"
                    className="flex items-center gap-2 px-3 py-[6px] rounded-[6px] border text-caption transition-colors"
                    style={{
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-elevated)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                    }}
                >
                    <Plus size={14} />
                    <span>Nova conversa</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-[2px] overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors relative"
                            style={{
                                background: isActive ? "var(--bg-elevated)" : "transparent",
                                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                fontWeight: isActive ? 500 : 400,
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) e.currentTarget.style.background = "var(--bg-elevated)";
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) e.currentTarget.style.background = "transparent";
                            }}
                        >
                            <item.icon size={16} />
                            <span>{item.label}</span>
                            {item.badge && alertCount > 0 && (
                                <span
                                    className="absolute right-3 flex items-center justify-center w-[18px] h-[18px] rounded-full text-[10px] font-medium"
                                    style={{
                                        background: "var(--accent-amber)",
                                        color: "#000",
                                    }}
                                >
                                    {alertCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div
                className="px-3 py-3 space-y-[2px] border-t"
                style={{ borderColor: "var(--border)" }}
            >
                <Link
                    href="/configuracoes"
                    className="flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors"
                    style={{
                        background: pathname.startsWith("/configuracoes") ? "var(--bg-elevated)" : "transparent",
                        color: pathname.startsWith("/configuracoes") ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: pathname.startsWith("/configuracoes") ? 500 : 400,
                    }}
                    onMouseEnter={(e) => { if (!pathname.startsWith("/configuracoes")) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { if (!pathname.startsWith("/configuracoes")) e.currentTarget.style.background = "transparent"; }}
                >
                    <Settings size={16} />
                    <span>Configurações</span>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] w-full transition-colors cursor-pointer"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-elevated)";
                        e.currentTarget.style.color = "var(--accent-red)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-muted)";
                    }}
                >
                    <LogOut size={16} />
                    <span>Sair</span>
                </button>
                <div
                    className="flex items-center gap-2.5 px-3 py-[7px] text-[13px]"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <div
                        className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-medium"
                        style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        {userInitial}
                    </div>
                    <span>{userName}</span>
                </div>
            </div>
        </aside>
    );
}
