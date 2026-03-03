import Link from "next/link";
import { Diamond } from "lucide-react";

export default function WelcomePage() {
    return (
        <div className="flex flex-col items-center text-center animate-fade-up">
            <Diamond
                size={32}
                className="mb-8"
                style={{ color: "var(--text-primary)" }}
            />

            <h1
                className="text-h2 mb-4"
                style={{ color: "var(--text-primary)" }}
            >
                Olá. Eu sou o Finance Friend.
            </h1>

            <p
                className="text-body max-w-[340px] mb-10"
                style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
            >
                Estou aqui para te ajudar a entender melhor suas finanças — sem
                julgamentos.
            </p>

            <Link
                href="/onboarding/profile"
                className="inline-flex items-center gap-2 px-6 py-[10px] rounded-[6px] text-[14px] transition-opacity hover:opacity-90"
                style={{
                    background: "var(--text-primary)",
                    color: "var(--bg-base)",
                    fontWeight: 590,
                }}
            >
                Vamos começar →
            </Link>
        </div>
    );
}
