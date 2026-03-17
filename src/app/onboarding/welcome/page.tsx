import Link from "next/link";

export default function WelcomePage() {
    return (
        <div className="animate-fade-up w-full max-w-[480px]">
            {/* Greeting */}
            <div className="mb-10">
                <p
                    className="text-[13px] mb-4"
                    style={{ color: "var(--accent-green)", fontWeight: 500 }}
                >
                    Bem-vindo
                </p>
                <h1
                    className="text-h1 mb-4"
                    style={{ color: "var(--text-primary)", lineHeight: "1.15" }}
                >
                    Suas finanças,
                    <br />
                    sem complicação.
                </h1>
                <p
                    className="text-body"
                    style={{ color: "var(--text-secondary)", lineHeight: "1.65", maxWidth: 320 }}
                >
                    O Finance Friend analisa seus gastos, te dá insights reais e te ajuda a tomar decisões melhores com seu dinheiro — sem planilhas.
                </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-col gap-3 mb-10">
                {[
                    { icon: "💬", text: "Converse com seu copiloto financeiro" },
                    { icon: "📊", text: "Veja para onde vai cada centavo" },
                    { icon: "🎯", text: "Alcance seus objetivos com clareza" },
                ].map((item) => (
                    <div
                        key={item.text}
                        className="flex items-center gap-3 px-4 py-3 rounded-[8px]"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                        <span className="text-[18px]">{item.icon}</span>
                        <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <Link
                href="/onboarding/profile"
                className="flex items-center justify-center gap-2 w-full py-[14px] rounded-[8px] text-[15px] transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{
                    background: "var(--text-primary)",
                    color: "var(--bg-base)",
                    fontWeight: 590,
                }}
            >
                Começar →
            </Link>
            <p
                className="text-center text-caption mt-3"
                style={{ color: "var(--text-muted)" }}
            >
                Leva menos de 2 minutos
            </p>
        </div>
    );
}
