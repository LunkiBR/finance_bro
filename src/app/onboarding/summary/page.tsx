"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileData {
    nome: string;
    rendaMensal: string | null;
    dividaMensal: string | null;
    bancoPrincipal: string | null;
    objetivoPrincipal: string | null;
    temReserva: string | null;
    categoriasAltas: string[];
}

const reservaLabels: Record<string, string> = {
    sim: "Sim, completa",
    parcial: "Parcialmente",
    nao: "Ainda não",
};

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
        { label: "Renda mensal", value: profile.rendaMensal ? `R$ ${profile.rendaMensal}` : "Não informada" },
        { label: "Dívidas mensais", value: profile.dividaMensal ? `R$ ${profile.dividaMensal}` : "Nenhuma" },
        { label: "Banco principal", value: profile.bancoPrincipal || "Não informado" },
        { label: "Objetivo", value: profile.objetivoPrincipal || "Não informado" },
        { label: "Reserva atual", value: profile.temReserva ? reservaLabels[profile.temReserva] || profile.temReserva : "Não informada" },
        { label: "Maiores gastos", value: profile.categoriasAltas.join(", ") || "Nenhum selecionado" },
    ];

    return (
        <div className="w-full max-w-[480px] px-6 animate-fade-up">
            <h2 className="text-h2 mb-2" style={{ color: "var(--text-primary)" }}>
                Pronto, {profile.nome}. Aqui está o que entendi:
            </h2>

            <div
                className="mt-6 rounded-[6px] border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
            >
                {rows.map((row, i) => (
                    <div
                        key={row.label}
                        className="flex justify-between items-center px-4 py-3 text-[13px]"
                        style={{
                            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                    >
                        <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>

            <p
                className="text-caption mt-4"
                style={{ color: "var(--text-muted)", lineHeight: "1.5" }}
            >
                Vou usar isso para personalizar minha análise. Você pode atualizar
                qualquer informação depois.
            </p>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-[10px] rounded-[6px] text-[14px] transition-opacity disabled:opacity-50"
                    style={{
                        background: "var(--text-primary)",
                        color: "var(--bg-base)",
                        fontWeight: 590,
                    }}
                >
                    {saving ? "Salvando..." : "Entrar no Finance Friend →"}
                </button>
            </div>
        </div>
    );
}
