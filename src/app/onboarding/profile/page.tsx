"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStep } from "@/components/onboarding/onboarding-step";

const BANKS = ["Nubank", "Itaú", "Bradesco", "C6 Bank", "Santander", "Outro"];
const OBJECTIVES = [
    { label: "Sair das dívidas", icon: "↓" },
    { label: "Criar reserva de emergência", icon: "🛡" },
    { label: "Começar a investir", icon: "📈" },
    { label: "Guardar para algo específico", icon: "🎯" },
    { label: "Apenas me organizar financeiramente", icon: "📋" },
];
const RESERVA_OPTIONS = [
    "Sim, tenho pelo menos 3 meses de gastos",
    "Estou construindo",
    "Ainda não tenho",
];
const SPENDING_CATEGORIES = [
    "Alimentação", "Transporte", "Moradia", "Lazer",
    "Assinaturas", "Saúde", "Educação", "Roupas", "Outro",
];

export default function ProfilePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        nome: "",
        rendaMensal: "",
        skipRenda: false,
        temDivida: null as boolean | null,
        dividaMensal: "",
        bancoPrincipal: "",
        objetivoPrincipal: "",
        temReserva: "",
        categoriasAltas: [] as string[],
    });

    const totalSteps = 7;

    function next() {
        if (step < totalSteps) setStep(step + 1);
        else handleSubmit();
    }

    async function handleSubmit() {
        const profile = {
            nome: form.nome,
            rendaMensal: form.skipRenda ? null : form.rendaMensal || null,
            dividaMensal: form.temDivida ? form.dividaMensal || null : null,
            bancoPrincipal: form.bancoPrincipal || null,
            objetivoPrincipal: form.objetivoPrincipal || null,
            temReserva: form.temReserva === RESERVA_OPTIONS[0]
                ? "sim"
                : form.temReserva === RESERVA_OPTIONS[1]
                    ? "parcial"
                    : form.temReserva === RESERVA_OPTIONS[2]
                        ? "nao"
                        : null,
            categoriasAltas: form.categoriasAltas,
        };

        // Store in sessionStorage for summary page
        sessionStorage.setItem("onboarding_profile", JSON.stringify(profile));
        router.push("/onboarding/summary");
    }

    const canContinue = () => {
        switch (step) {
            case 1: return form.nome.trim().length > 0;
            case 2: return form.skipRenda || form.rendaMensal.length > 0;
            case 3: return form.temDivida !== null && (form.temDivida === false || form.dividaMensal.length > 0);
            case 4: return form.bancoPrincipal.length > 0;
            case 5: return form.objetivoPrincipal.length > 0;
            case 6: return form.temReserva.length > 0;
            case 7: return form.categoriasAltas.length > 0;
            default: return false;
        }
    };

    const progressPct = (step / totalSteps) * 100;

    return (
        <div className="w-full max-w-[480px] px-6">
            {/* Progress bar */}
            <div
                className="fixed top-0 left-0 h-[2px] transition-all duration-500"
                style={{
                    width: `${progressPct}%`,
                    background: "var(--accent-green)",
                }}
            />

            {/* Step 1: Nome */}
            {step === 1 && (
                <OnboardingStep key="step-1">
                    <h2 className="text-h2 mb-2" style={{ color: "var(--text-primary)" }}>
                        Qual é o seu nome?
                    </h2>
                    <input
                        type="text"
                        placeholder="Seu primeiro nome"
                        value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        autoFocus
                        className="w-full px-4 py-3 rounded-[6px] border text-body mt-6 mb-2"
                        style={{
                            background: "var(--bg-elevated)",
                            borderColor: "var(--border)",
                            color: "var(--text-primary)",
                        }}
                        onKeyDown={(e) => e.key === "Enter" && canContinue() && next()}
                    />
                    <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                        Pode ser só o primeiro nome
                    </p>
                </OnboardingStep>
            )}

            {/* Step 2: Renda */}
            {step === 2 && (
                <OnboardingStep key="step-2">
                    <h2 className="text-h2 mb-2" style={{ color: "var(--text-primary)" }}>
                        Olá, {form.nome}. Quanto você recebe por mês, em média?
                    </h2>
                    <div className="relative mt-6 mb-3">
                        <span
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-body"
                            style={{ color: "var(--text-muted)" }}
                        >
                            R$
                        </span>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={form.rendaMensal}
                            onChange={(e) => setForm({ ...form, rendaMensal: e.target.value, skipRenda: false })}
                            disabled={form.skipRenda}
                            autoFocus
                            className="w-full pl-12 pr-4 py-3 rounded-[6px] border text-body"
                            style={{
                                background: "var(--bg-elevated)",
                                borderColor: "var(--border)",
                                color: "var(--text-primary)",
                                opacity: form.skipRenda ? 0.5 : 1,
                            }}
                            onKeyDown={(e) => e.key === "Enter" && canContinue() && next()}
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.skipRenda}
                            onChange={(e) => setForm({ ...form, skipRenda: e.target.checked, rendaMensal: "" })}
                            className="rounded"
                        />
                        <span className="text-caption" style={{ color: "var(--text-secondary)" }}>
                            Prefiro não informar agora
                        </span>
                    </label>
                </OnboardingStep>
            )}

            {/* Step 3: Dívidas */}
            {step === 3 && (
                <OnboardingStep key="step-3">
                    <h2 className="text-h2 mb-6" style={{ color: "var(--text-primary)" }}>
                        Você tem parcelas ou dívidas ativas?
                    </h2>
                    <div className="flex gap-3 mb-4">
                        {[true, false].map((val) => (
                            <button
                                key={String(val)}
                                onClick={() => setForm({ ...form, temDivida: val })}
                                className="flex-1 py-3 rounded-[6px] border text-body transition-colors"
                                style={{
                                    borderColor: form.temDivida === val ? "var(--border-strong)" : "var(--border)",
                                    background: form.temDivida === val ? "var(--bg-elevated)" : "transparent",
                                    color: "var(--text-primary)",
                                }}
                            >
                                {val ? "Sim" : "Não"}
                            </button>
                        ))}
                    </div>
                    {form.temDivida && (
                        <div className="animate-fade-up">
                            <p className="text-body mb-3" style={{ color: "var(--text-secondary)" }}>
                                Quanto você paga em dívidas por mês?
                            </p>
                            <div className="relative">
                                <span
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-body"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    R$
                                </span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    value={form.dividaMensal}
                                    onChange={(e) => setForm({ ...form, dividaMensal: e.target.value })}
                                    autoFocus
                                    className="w-full pl-12 pr-4 py-3 rounded-[6px] border text-body"
                                    style={{
                                        background: "var(--bg-elevated)",
                                        borderColor: "var(--border)",
                                        color: "var(--text-primary)",
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && canContinue() && next()}
                                />
                            </div>
                        </div>
                    )}
                </OnboardingStep>
            )}

            {/* Step 4: Banco */}
            {step === 4 && (
                <OnboardingStep key="step-4">
                    <h2 className="text-h2 mb-6" style={{ color: "var(--text-primary)" }}>
                        Qual banco você usa principalmente?
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {BANKS.map((bank) => (
                            <button
                                key={bank}
                                onClick={() => setForm({ ...form, bancoPrincipal: bank })}
                                className="py-3 rounded-[6px] border text-body transition-colors"
                                style={{
                                    borderColor: form.bancoPrincipal === bank ? "var(--border-strong)" : "var(--border)",
                                    background: form.bancoPrincipal === bank ? "var(--bg-elevated)" : "transparent",
                                    color: "var(--text-primary)",
                                }}
                            >
                                {bank}
                            </button>
                        ))}
                    </div>
                </OnboardingStep>
            )}

            {/* Step 5: Objetivo */}
            {step === 5 && (
                <OnboardingStep key="step-5">
                    <h2 className="text-h2 mb-6" style={{ color: "var(--text-primary)" }}>
                        Qual é o seu principal objetivo financeiro agora?
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {OBJECTIVES.map((obj) => (
                            <button
                                key={obj.label}
                                onClick={() => setForm({ ...form, objetivoPrincipal: obj.label })}
                                className={`flex items-start gap-2 p-4 rounded-[6px] border text-left text-[13px] transition-colors ${obj.label.includes("Apenas") ? "col-span-2" : ""
                                    }`}
                                style={{
                                    borderColor: form.objetivoPrincipal === obj.label ? "var(--border-strong)" : "var(--border)",
                                    background: form.objetivoPrincipal === obj.label ? "var(--bg-elevated)" : "transparent",
                                    color: "var(--text-primary)",
                                }}
                            >
                                <span>{obj.icon}</span>
                                <span>{obj.label}</span>
                            </button>
                        ))}
                    </div>
                </OnboardingStep>
            )}

            {/* Step 6: Reserva */}
            {step === 6 && (
                <OnboardingStep key="step-6">
                    <h2 className="text-h2 mb-6" style={{ color: "var(--text-primary)" }}>
                        Você já tem uma reserva de emergência?
                    </h2>
                    <div className="space-y-3">
                        {RESERVA_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => setForm({ ...form, temReserva: option })}
                                className="w-full text-left px-4 py-3 rounded-[6px] border text-[13px] transition-colors"
                                style={{
                                    borderColor: form.temReserva === option ? "var(--border-strong)" : "var(--border)",
                                    background: form.temReserva === option ? "var(--bg-elevated)" : "transparent",
                                    color: "var(--text-primary)",
                                }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </OnboardingStep>
            )}

            {/* Step 7: Maiores gastos */}
            {step === 7 && (
                <OnboardingStep key="step-7">
                    <h2 className="text-h2 mb-2" style={{ color: "var(--text-primary)" }}>
                        Em que você costuma gastar mais?
                    </h2>
                    <p className="text-caption mb-6" style={{ color: "var(--text-muted)" }}>
                        Selecione todas que se aplicam
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {SPENDING_CATEGORIES.map((cat) => {
                            const isSelected = form.categoriasAltas.includes(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() =>
                                        setForm({
                                            ...form,
                                            categoriasAltas: isSelected
                                                ? form.categoriasAltas.filter((c) => c !== cat)
                                                : [...form.categoriasAltas, cat],
                                        })
                                    }
                                    className="px-4 py-2 rounded-[6px] border text-[13px] transition-colors"
                                    style={{
                                        borderColor: isSelected ? "var(--border-strong)" : "var(--border)",
                                        background: isSelected ? "var(--bg-elevated)" : "transparent",
                                        color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                                    }}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </OnboardingStep>
            )}

            {/* Continue button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={next}
                    disabled={!canContinue()}
                    className="inline-flex items-center gap-2 px-6 py-[10px] rounded-[6px] text-[14px] transition-opacity disabled:opacity-30"
                    style={{
                        background: "var(--text-primary)",
                        color: "var(--bg-base)",
                        fontWeight: 590,
                    }}
                >
                    Continuar →
                </button>
            </div>
        </div>
    );
}
