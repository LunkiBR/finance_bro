"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera } from "lucide-react";

const OBJECTIVES = [
    { label: "Sair das dívidas", icon: "📉" },
    { label: "Criar reserva de emergência", icon: "🛡️" },
    { label: "Começar a investir", icon: "📈" },
    { label: "Guardar para algo específico", icon: "🎯" },
    { label: "Me organizar financeiramente", icon: "📋" },
];

const SPENDING_CATEGORIES = [
    "Alimentação", "Transporte", "Moradia", "Lazer",
    "Assinaturas", "Saúde", "Educação", "Roupas", "Outro",
];

// Step config: title + subtitle for each step
const STEPS = [
    { title: "Como posso te chamar?", subtitle: "Vamos personalizar sua experiência." },
    { title: "Adicione uma foto", subtitle: "Opcional — aparece no seu perfil." },
    { title: "Qual é o seu objetivo?", subtitle: "Escolha o que mais combina com você agora." },
    { title: "Você tem dívidas ativas?", subtitle: "Parcelas, cartão, empréstimos..." },
    { title: "Em que você mais gasta?", subtitle: "Selecione todas que se aplicam." },
];

const TOTAL_STEPS = STEPS.length;

export default function ProfilePage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        nome: "",
        foto: null as string | null, // base64 preview
        objetivoPrincipal: "",
        temDivida: null as boolean | null,
        dividaMensal: "",
        categoriasAltas: [] as string[],
    });

    function next() {
        if (step < TOTAL_STEPS - 1) setStep(step + 1);
        else handleSubmit();
    }

    function back() {
        if (step > 0) setStep(step - 1);
        else router.push("/onboarding/welcome");
    }

    async function handleSubmit() {
        const profile = {
            nome: form.nome,
            fotoBase64: form.foto || null,
            objetivoPrincipal: form.objetivoPrincipal || null,
            dividaMensal: form.temDivida ? form.dividaMensal || null : null,
            categoriasAltas: form.categoriasAltas,
        };

        sessionStorage.setItem("onboarding_profile", JSON.stringify(profile));
        router.push("/onboarding/summary");
    }

    const canContinue = () => {
        switch (step) {
            case 0: return form.nome.trim().length > 0;
            case 1: return true; // photo is optional
            case 2: return form.objetivoPrincipal.length > 0;
            case 3: return form.temDivida !== null && (form.temDivida === false || form.dividaMensal.length > 0);
            case 4: return form.categoriasAltas.length > 0;
            default: return false;
        }
    };

    const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setForm({ ...form, foto: reader.result as string });
        reader.readAsDataURL(file);
    }

    return (
        <div className="w-full max-w-[480px] flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
            {/* Progress bar */}
            <div
                className="fixed top-0 left-0 right-0 h-[2px] transition-all duration-500 z-10"
                style={{ width: `${progressPct}%`, background: "var(--accent-green)" }}
            />

            {/* Back + step counter */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={back}
                    className="flex items-center gap-1 text-[13px] transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-muted)" }}
                >
                    <ChevronLeft size={16} />
                    Voltar
                </button>
                <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                    {step + 1} de {TOTAL_STEPS}
                </span>
            </div>

            {/* Step header */}
            <div className="mb-8 animate-fade-up" key={`header-${step}`}>
                <h2 className="text-h2 mb-2" style={{ color: "var(--text-primary)" }}>
                    {STEPS[step].title}
                </h2>
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                    {STEPS[step].subtitle}
                </p>
            </div>

            {/* Step content */}
            <div className="flex-1 animate-fade-up" key={`content-${step}`}>

                {/* Step 0: Name */}
                {step === 0 && (
                    <input
                        type="text"
                        placeholder="Seu primeiro nome"
                        value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        autoFocus
                        className="w-full px-4 py-4 rounded-[8px] border text-body"
                        style={{
                            background: "var(--bg-elevated)",
                            borderColor: "var(--border)",
                            color: "var(--text-primary)",
                            fontSize: "16px",
                        }}
                        onKeyDown={(e) => e.key === "Enter" && canContinue() && next()}
                    />
                )}

                {/* Step 1: Photo */}
                {step === 1 && (
                    <div className="flex flex-col items-center gap-5">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80"
                            style={{
                                background: "var(--bg-elevated)",
                                border: "2px dashed var(--border-strong)",
                            }}
                        >
                            {form.foto ? (
                                <img
                                    src={form.foto}
                                    alt="Foto do perfil"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    <Camera size={24} style={{ color: "var(--text-muted)" }} />
                                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                        Escolher
                                    </span>
                                </div>
                            )}
                        </button>

                        {form.foto && (
                            <button
                                onClick={() => setForm({ ...form, foto: null })}
                                className="text-caption transition-opacity hover:opacity-70"
                                style={{ color: "var(--text-muted)" }}
                            >
                                Remover foto
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </div>
                )}

                {/* Step 2: Goal */}
                {step === 2 && (
                    <div className="flex flex-col gap-3">
                        {OBJECTIVES.map((obj) => (
                            <button
                                key={obj.label}
                                onClick={() => setForm({ ...form, objetivoPrincipal: obj.label })}
                                className="flex items-center gap-3 w-full text-left px-4 py-4 rounded-[8px] border transition-all"
                                style={{
                                    borderColor: form.objetivoPrincipal === obj.label ? "var(--border-strong)" : "var(--border)",
                                    background: form.objetivoPrincipal === obj.label ? "var(--bg-elevated)" : "transparent",
                                    color: "var(--text-primary)",
                                }}
                            >
                                <span className="text-[20px]">{obj.icon}</span>
                                <span className="text-[14px]">{obj.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 3: Debts */}
                {step === 3 && (
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            {[true, false].map((val) => (
                                <button
                                    key={String(val)}
                                    onClick={() => setForm({ ...form, temDivida: val })}
                                    className="flex-1 py-4 rounded-[8px] border text-body transition-all"
                                    style={{
                                        borderColor: form.temDivida === val ? "var(--border-strong)" : "var(--border)",
                                        background: form.temDivida === val ? "var(--bg-elevated)" : "transparent",
                                        color: "var(--text-primary)",
                                        fontWeight: form.temDivida === val ? 590 : 400,
                                    }}
                                >
                                    {val ? "Sim" : "Não"}
                                </button>
                            ))}
                        </div>

                        {form.temDivida && (
                            <div className="animate-fade-up mt-2">
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
                                        className="w-full pl-12 pr-4 py-4 rounded-[8px] border text-body"
                                        style={{
                                            background: "var(--bg-elevated)",
                                            borderColor: "var(--border)",
                                            color: "var(--text-primary)",
                                            fontSize: "16px",
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && canContinue() && next()}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Spending Categories */}
                {step === 4 && (
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
                                    className="px-4 py-3 rounded-[8px] border text-[13px] transition-all"
                                    style={{
                                        borderColor: isSelected ? "var(--accent-green)" : "var(--border)",
                                        background: isSelected ? "rgba(0,166,126,0.1)" : "transparent",
                                        color: isSelected ? "var(--accent-green)" : "var(--text-secondary)",
                                        fontWeight: isSelected ? 500 : 400,
                                    }}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Continue CTA */}
            <div className="mt-8 pb-2">
                <button
                    onClick={next}
                    disabled={!canContinue()}
                    className="w-full py-[14px] rounded-[8px] text-[15px] transition-all disabled:opacity-30 active:scale-[0.98]"
                    style={{
                        background: "var(--text-primary)",
                        color: "var(--bg-base)",
                        fontWeight: 590,
                    }}
                >
                    {step === TOTAL_STEPS - 1 ? "Ver resumo →" : "Continuar →"}
                </button>
                {step === 1 && (
                    <button
                        onClick={next}
                        className="w-full text-center text-caption mt-3 transition-opacity hover:opacity-70"
                        style={{ color: "var(--text-muted)" }}
                    >
                        Pular por agora
                    </button>
                )}
            </div>
        </div>
    );
}
