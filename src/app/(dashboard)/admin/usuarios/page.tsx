"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  UserPlus, Shield, User, Trash2, CheckCircle,
  Clock, Ban, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";

interface UserRow {
  id: string;
  name: string | null;
  username: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "pending" | "suspended";
  avatarUrl: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  suspended: "Suspenso",
};

const STATUS_COLOR: Record<string, string> = {
  active: "var(--accent-green)",
  pending: "#F59E0B",
  suspended: "var(--accent-red)",
};

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", role: "user" });
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setUsers(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setFormError(data.error ?? "Erro ao criar usuário"); return; }
    setForm({ name: "", username: "", email: "", password: "", role: "user" });
    setShowForm(false);
    load();
  };

  const approveUser = async (user: UserRow) => {
    setApprovingId(user.id);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    setApprovingId(null);
    load();
  };

  const toggleStatus = async (user: UserRow) => {
    const next = user.status === "active" ? "suspended" : "active";
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar este usuário? Esta ação não pode ser desfeita.")) return;
    setDeletingId(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  };

  const pending = users.filter((u) => u.status === "pending");
  const others = users.filter((u) => u.status !== "pending");

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6 pb-24 space-y-6" style={{ color: "var(--text-primary)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">Usuários</h1>
          <p className="text-caption mt-0.5" style={{ color: "var(--text-muted)" }}>
            {users.length} cadastrado{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border text-[13px] transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
          >
            <UserPlus size={14} />
            Novo
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-[10px] border p-4 space-y-3"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <h2 className="text-[13px] font-medium">Criar novo usuário</h2>
          <div className="flex flex-col gap-2">
            {[
              { placeholder: "Nome completo", key: "name", type: "text", required: false },
              { placeholder: "Username *", key: "username", type: "text", required: true },
              { placeholder: "Email *", key: "email", type: "email", required: true },
              { placeholder: "Senha (mín. 8 chars) *", key: "password", type: "password", required: true },
            ].map((f) => (
              <input
                key={f.key}
                type={f.type}
                placeholder={f.placeholder}
                required={f.required}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full px-3 py-2.5 rounded-[8px] border text-[13px]"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "16px",
                }}
              />
            ))}
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2.5 rounded-[8px] border text-[13px]"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {formError && <p className="text-[12px]" style={{ color: "var(--accent-red)" }}>{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-[8px] text-[13px] font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
            >
              {saving ? "Criando..." : "Criar usuário"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="px-4 py-2.5 rounded-[8px] border text-[13px] transition-opacity hover:opacity-70"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Carregando...</div>
      ) : (
        <>
          {/* ── Pending approvals (priority section) ── */}
          {pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} style={{ color: "#F59E0B" }} />
                <h2 className="text-[13px] font-medium" style={{ color: "#F59E0B" }}>
                  Aguardando aprovação ({pending.length})
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {pending.map((u) => {
                  const isSelf = u.id === session?.user?.id;
                  return (
                    <div
                      key={u.id}
                      className="rounded-[10px] border p-4"
                      style={{
                        background: "rgba(245,158,11,0.05)",
                        borderColor: "rgba(245,158,11,0.3)",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-medium shrink-0"
                          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                        >
                          {(u.name || u.username)[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium truncate">{u.name || u.username}</p>
                          <p className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>
                            @{u.username} · {u.email}
                          </p>
                        </div>
                      </div>
                      {!isSelf && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveUser(u)}
                            disabled={approvingId === u.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[8px] text-[13px] font-medium transition-opacity disabled:opacity-50"
                            style={{ background: "var(--accent-green)", color: "#fff" }}
                          >
                            <CheckCircle size={14} />
                            {approvingId === u.id ? "Aprovando..." : "Aprovar"}
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id}
                            className="px-4 py-2.5 rounded-[8px] border text-[13px] transition-opacity hover:opacity-70 disabled:opacity-50"
                            style={{ borderColor: "var(--border)", color: "var(--accent-red)" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── All other users ── */}
          {others.length > 0 && (
            <section>
              {pending.length > 0 && (
                <h2 className="text-[13px] font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                  Usuários ativos
                </h2>
              )}
              <div
                className="rounded-[10px] border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                {others.map((u, idx) => {
                  const isSelf = u.id === session?.user?.id;
                  const isExpanded = expandedId === u.id;
                  return (
                    <div
                      key={u.id}
                      style={{
                        borderBottom: idx < others.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      {/* Row header */}
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                        style={{ background: isExpanded ? "var(--bg-elevated)" : "var(--bg-surface)" }}
                        onClick={() => setExpandedId(isExpanded ? null : u.id)}
                      >
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0"
                            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                          >
                            {(u.name || u.username)[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium truncate">{u.name || u.username}</p>
                            {isSelf && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: "rgba(247,248,248,0.1)", color: "var(--text-muted)" }}
                              >
                                você
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[11px]"
                              style={{ color: STATUS_COLOR[u.status] }}
                            >
                              {STATUS_LABEL[u.status]}
                            </span>
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>·</span>
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              {u.role === "admin" ? "Admin" : "Usuário"}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        ) : (
                          <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        )}
                      </button>

                      {/* Expanded actions */}
                      {isExpanded && !isSelf && (
                        <div
                          className="px-4 pb-4 pt-2 flex flex-col gap-2"
                          style={{ background: "var(--bg-elevated)" }}
                        >
                          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            Criado em {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => toggleStatus(u)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[8px] border text-[13px] font-medium transition-opacity hover:opacity-80"
                              style={{
                                borderColor: u.status === "active" ? "var(--accent-red)" : "var(--accent-green)",
                                color: u.status === "active" ? "var(--accent-red)" : "var(--accent-green)",
                              }}
                            >
                              {u.status === "active" ? (
                                <><Ban size={13} /> Suspender</>
                              ) : (
                                <><CheckCircle size={13} /> Reativar</>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              disabled={deletingId === u.id}
                              className="px-4 py-2.5 rounded-[8px] border text-[13px] transition-opacity hover:opacity-70 disabled:opacity-50"
                              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {users.length === 0 && (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              Nenhum usuário encontrado.
            </div>
          )}
        </>
      )}
    </div>
  );
}
