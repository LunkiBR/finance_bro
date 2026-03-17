"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
    Tags,
    BookOpen,
    Cpu,
    Users,
    User,
} from "lucide-react";

const navItems = [
    { href: "/copiloto", label: "Copiloto", icon: MessageSquare },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transacoes", label: "Transações", icon: List },
    { href: "/categorias", label: "Categorias", icon: Tags },
    { href: "/orcamentos", label: "Orçamentos", icon: PieChart },
    { href: "/metas", label: "Metas", icon: Target },
    { href: "/automacoes", label: "Automações", icon: Zap },
    { href: "/alertas", label: "Alertas", icon: Bell, badge: true },
    { href: "/importar", label: "Importar", icon: Upload },
];

const adminMenuItems = [
    { href: "/configuracoes", label: "Meu Perfil", icon: User },
    { href: "/configuracoes", label: "Configurações", icon: Settings },
    { href: "/admin/usuarios", label: "Usuários", icon: Users },
    { href: "/admin/token-usage", label: "Uso de Tokens", icon: Cpu },
];

export function Sidebar() {
    const pathname = usePathname();
    const [alertCount, setAlertCount] = useState(0);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const adminMenuRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();

    const isAdmin = session?.user?.role === "admin";
    const userName = session?.user?.name || "Usuário";
    const userInitial = userName[0]?.toUpperCase() || "U";
    const avatarUrl = (session?.user as { avatarUrl?: string | null })?.avatarUrl;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
                setShowAdminMenu(false);
            }
        };
        if (showAdminMenu) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAdminMenu]);

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
            className="hidden md:flex flex-col h-[100dvh] w-[220px] shrink-0 border-r"
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
                <Link
                    href="/bem-vindo"
                    className="flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] transition-colors mb-2"
                    style={{
                        background: pathname === "/bem-vindo" ? "var(--bg-elevated)" : "transparent",
                        color: pathname === "/bem-vindo" ? "var(--text-primary)" : "var(--text-muted)",
                        fontWeight: pathname === "/bem-vindo" ? 500 : 400,
                    }}
                    onMouseEnter={(e) => { if (pathname !== "/bem-vindo") e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { if (pathname !== "/bem-vindo") e.currentTarget.style.background = "transparent"; }}
                >
                    <BookOpen size={16} />
                    <span>Como usar</span>
                </Link>
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
                {!isAdmin && (
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
                )}
                <button
                    onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
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

                {/* Avatar — clickable for admin with glow aura */}
                <div className="relative" ref={adminMenuRef}>
                    {/* Admin dropdown menu */}
                    {isAdmin && showAdminMenu && (
                        <div
                            className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border shadow-lg overflow-hidden z-50"
                            style={{
                                background: "var(--bg-surface)",
                                borderColor: "var(--border)",
                            }}
                        >
                            <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                                <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                    Admin
                                </p>
                            </div>
                            {adminMenuItems.map((item) => {
                                const isActive = pathname.startsWith(item.href) && (item.href !== "/configuracoes" || pathname.startsWith("/configuracoes"));
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setShowAdminMenu(false)}
                                        className="flex items-center gap-2.5 px-3 py-[8px] text-[13px] transition-colors"
                                        style={{
                                            background: isActive ? "var(--bg-elevated)" : "transparent",
                                            color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? "var(--bg-elevated)" : "transparent"; }}
                                    >
                                        <item.icon size={14} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    <style>{`
                        @keyframes adminGlow {
                            0%, 100% { box-shadow: 0 0 0 2px #f59e0b88, 0 0 8px 2px #f59e0b33; }
                            50% { box-shadow: 0 0 0 2px #f59e0b, 0 0 14px 4px #f59e0b55; }
                        }
                    `}</style>

                    <div
                        className={`flex items-center gap-2.5 px-3 py-[7px] text-[13px] rounded-[6px] transition-colors ${isAdmin ? "cursor-pointer" : ""}`}
                        style={{ color: "var(--text-secondary)" }}
                        onClick={isAdmin ? () => setShowAdminMenu((v) => !v) : undefined}
                        onMouseEnter={(e) => { if (isAdmin) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = showAdminMenu ? "var(--bg-elevated)" : "transparent"; }}
                    >
                        <div
                            className="shrink-0 rounded-full"
                            style={isAdmin ? { animation: "adminGlow 2.5s ease-in-out infinite", borderRadius: "50%" } : {}}
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={userName}
                                    className="w-[22px] h-[22px] rounded-full object-cover block"
                                />
                            ) : (
                                <div
                                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-medium"
                                    style={{
                                        background: isAdmin ? "#f59e0b22" : "var(--bg-elevated)",
                                        color: isAdmin ? "#f59e0b" : "var(--text-primary)",
                                        border: isAdmin ? "1px solid #f59e0b88" : "1px solid var(--border)",
                                    }}
                                >
                                    {userInitial}
                                </div>
                            )}
                        </div>
                        <span>{userName}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
