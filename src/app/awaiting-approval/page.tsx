import { Diamond, Clock } from "lucide-react";
import Link from "next/link";

export default function AwaitingApprovalPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 600px 400px at 50% 40%, rgba(59, 130, 246, 0.06), transparent)",
        }}
      />

      <div
        className="w-full max-w-[380px] relative text-center"
        style={{ animation: "fade-up 0.4s ease-out forwards" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Diamond size={20} style={{ color: "var(--text-primary)" }} />
          <span
            style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 590 }}
          >
            Finance Friend
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-[8px] p-8"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(234, 179, 8, 0.12)", border: "1px solid rgba(234, 179, 8, 0.25)" }}
          >
            <Clock size={24} style={{ color: "#eab308" }} />
          </div>

          <h1 className="text-h2 mb-3" style={{ color: "var(--text-primary)" }}>
            Conta criada!
          </h1>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Sua solicitação foi enviada. Um administrador precisa aprovar seu acesso antes que você possa entrar.
          </p>
          <p className="text-[13px] mt-3" style={{ color: "var(--text-muted)" }}>
            Você será notificado assim que sua conta for ativada.
          </p>
        </div>

        <p className="text-caption mt-4" style={{ color: "var(--text-muted)" }}>
          <Link
            href="/login"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
          >
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
