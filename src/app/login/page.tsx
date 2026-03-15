"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Diamond, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (res?.error) {
                const code = res.code ?? res.error;
                if (code === "account_pending") {
                    setError("Conta aguardando aprovação do administrador.");
                } else if (code === "account_suspended") {
                    setError("Conta suspensa. Entre em contato com o administrador.");
                } else {
                    setError("Usuário ou senha inválidos.");
                }
                setLoading(false);
                return;
            }

            router.push("/");
            router.refresh();
        } catch {
            setError("Erro de conexão. Tente novamente.");
            setLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "var(--bg-base)" }}
        >
            {/* Background glow effect */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse 600px 400px at 50% 40%, rgba(59, 130, 246, 0.06), transparent)",
                }}
            />

            <div
                className="w-full max-w-[380px] relative"
                style={{ animation: "fade-up 0.4s ease-out forwards" }}
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Diamond size={20} style={{ color: "var(--text-primary)" }} />
                    <span
                        className="text-h3"
                        style={{
                            color: "var(--text-primary)",
                            fontSize: "16px",
                            fontWeight: 590,
                        }}
                    >
                        Finance Friend
                    </span>
                </div>

                {/* Card */}
                <div
                    className="rounded-[8px] p-6"
                    style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    }}
                >
                    <div className="text-center mb-6">
                        <h1
                            className="text-h2 mb-1"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Entrar
                        </h1>
                        <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                            Acesse seu painel financeiro
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label
                                htmlFor="login-username"
                                className="block text-caption mb-1.5"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                Usuário
                            </label>
                            <input
                                id="login-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="seu.usuario"
                                required
                                autoComplete="username"
                                className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none transition-colors"
                                style={{
                                    background: "var(--bg-elevated)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-primary)",
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "var(--border-strong)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "var(--border)";
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="login-password"
                                className="block text-caption mb-1.5"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full px-3 py-2 pr-10 rounded-[6px] text-[13px] outline-none transition-colors"
                                    style={{
                                        background: "var(--bg-elevated)",
                                        border: "1px solid var(--border)",
                                        color: "var(--text-primary)",
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border-strong)";
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border)";
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                                    style={{ color: "var(--text-muted)" }}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                className="text-caption px-3 py-2 rounded-[6px]"
                                style={{
                                    background: "rgba(229, 72, 77, 0.1)",
                                    border: "1px solid rgba(229, 72, 77, 0.2)",
                                    color: "var(--accent-red)",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-[6px] text-[13px] font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: "var(--text-primary)",
                                color: "var(--bg-base)",
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.opacity = "0.9";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = "1";
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    Entrando...
                                </span>
                            ) : (
                                "Entrar"
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-caption mt-4" style={{ color: "var(--text-muted)" }}>
                    Não tem conta?{" "}
                    <Link
                        href="/register"
                        className="transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-primary)"; }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
                    >
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    );
}
