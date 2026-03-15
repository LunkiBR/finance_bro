"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Diamond, Eye, EyeOff, Loader2, Camera } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      // Use canvas to crop/resize to 128x128
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d")!;
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 128, 128);
        setAvatarPreview(canvas.toDataURL("image/webp", 0.85));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (form.password.length < 8) {
      setError("Senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          username: form.username,
          email: form.email,
          password: form.password,
          avatarUrl: avatarPreview || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar conta.");
        setLoading(false);
        return;
      }

      router.push("/awaiting-approval");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  const inp = "w-full px-3 py-2 rounded-[6px] text-[13px] outline-none transition-colors";
  const inpStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
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
        className="w-full max-w-[400px] relative"
        style={{ animation: "fade-up 0.4s ease-out forwards" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Diamond size={20} style={{ color: "var(--text-primary)" }} />
          <span
            className="text-h3"
            style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 590 }}
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
            <h1 className="text-h2 mb-1" style={{ color: "var(--text-primary)" }}>
              Criar conta
            </h1>
            <p className="text-caption" style={{ color: "var(--text-muted)" }}>
              Preencha seus dados para solicitar acesso
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div className="flex justify-center mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group"
                title="Escolher foto de perfil"
              >
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden transition-opacity"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "2px solid var(--border)",
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={24} style={{ color: "var(--text-muted)" }} />
                  )}
                </div>
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.4)" }}
                >
                  <Camera size={16} color="#fff" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-center text-[11px] -mt-2" style={{ color: "var(--text-muted)" }}>
              Foto de perfil (opcional)
            </p>

            {/* Name */}
            <div>
              <label className="block text-caption mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Como quer ser chamado <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
              </label>
              <input
                className={inp}
                style={inpStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Seu nome"
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-caption mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Username *
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] select-none"
                  style={{ color: "var(--text-muted)" }}
                >
                  @
                </span>
                <input
                  className={inp}
                  style={{ ...inpStyle, paddingLeft: "24px" }}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                  placeholder="seu.usuario"
                  required
                  autoComplete="username"
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
              </div>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                3-30 caracteres: letras, números e _
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-caption mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Email *
              </label>
              <input
                type="email"
                className={inp}
                style={inpStyle}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
                autoComplete="email"
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-caption mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={inp}
                  style={{ ...inpStyle, paddingRight: "40px" }}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "var(--text-muted)" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-caption mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Confirmar senha *
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className={inp}
                  style={{ ...inpStyle, paddingRight: "40px" }}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Repita a senha"
                  required
                  autoComplete="new-password"
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "var(--text-muted)" }}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
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
              style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Criando conta...
                </span>
              ) : (
                "Criar conta"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-caption mt-4" style={{ color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link
            href="/login"
            className="transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
