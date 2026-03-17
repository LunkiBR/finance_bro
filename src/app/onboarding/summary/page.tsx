"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface ProfileData {
    nome: string;
    fotoBase64: string | null;
    objetivoPrincipal: string | null;
    dividaMensal: string | null;
    categoriasAltas: string[];
}

export default function SummaryPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const data = sessionStorage.getItem("onboarding_profile");
        if (data) {
            setProfile(JSON.parse(data));
        } else {
            router.push("/onboarding/welcome");
        }
    }, [router]);

    async function handleConfirm() {
        if (!profile) return;
        setSaving(true);

        try {
            await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });

            sessionStorage.removeItem("onboarding_profile");
            router.push("/bem-vindo");
        } catch {
            setSaving(false);
        }
    }

    if (!profile) return null;

    const rows = [
        { label: "Objetivo", value: profile.objetivoPrincipal || "Não informado" },
        { label: "Dívidas mensais", value: profile.dividaMensal ? `R$ ${profile.dividaMensal}` : "Nenhuma" },
        { label: "Maiores gastos", value: profile.categoriasAltas.join(", ") || "Nenhum selecionado" },
    ];

    return (
        <div className="w-full max-w-[480px] animate-fade-up">
            {/* Back */}
            <button
                onClick={() => router.push("/onboarding/profile")}
                className="flex items-center gap-1 text-[13px] mb-8 transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
            >
                <ChevronLeft size={16} />
                Voltar
            </button>

            {/* User identity */}
            <div className="flex items-center gap-4 mb-8">
                {profile.fotoBase64 ? (
                    <img
                        src={profile.fotoBase64}
                        alt="Foto do perfil"
                        className="w-14 h-14 rounded-full object-cover"
                        style={{ border: "2px solid var(--border)" }}
                    />
                ) : (
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-[20px]"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                        {profile.nome.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <p className="text-h3" style={{ color: "var(--text-primary)" }}>{profile.nome}</p>
                    <p className="text-caption" style={{ color: "var(--text-muted)" }}>Tudo certo!</p>
                </div>
            </div>

            <h2 className="text-h2 mb-1" style={{ color: "var(--text-primary)" }}>
                Aqui está o que eu sei sobre você
            </h2>
            <p className="text-body mb-6" style={{ color: "var(--text-secondary)" }}>
                Confirme e vamos começar.
            </p>

            {/* Summary card */}
            <div
                className="rounded-[8px] border overflow-hidden mb-6"
                style={{ borderColor: "var(--border)" }}
            >
                {rows.map((row, i) => (
                    <div
                        key={row.label}
                        className="flex justify-between items-start gap-4 px-4 py-4 text-[13px]"
                        style={{
                            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                    >
                        <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                        <span
                            className="text-right"
                            style={{ color: "var(--text-primary)", fontWeight: 500, maxWidth: "60%" }}
                        >
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>

            <p
                className="text-caption mb-8"
                style={{ color: "var(--text-muted)", lineHeight: "1.5" }}
            >
                Você pode editar qualquer informação depois nas configurações.
            </p>

            <button
                onClick={handleConfirm}
                disabled={saving}
                className="w-full py-[14px] rounded-[8px] text-[15px] transition-all disabled:opacity-50 active:scale-[0.98]"
                style={{
                    background: "var(--text-primary)",
                    color: "var(--bg-base)",
                    fontWeight: 590,
                }}
            >
                {saving ? "Salvando..." : "Entrar no Finance Friend →"}
            </button>
        </div>
    );
}
