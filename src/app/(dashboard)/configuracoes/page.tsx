"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface UserRecord {
    id: string;
    name: string | null;
    username: string;
    email: string;
    role: string;
    createdAt: string;
}

const emptyForm = {
    name: "",
    username: "",
    email: "",
    role: "user",
    password: "",
    confirmPassword: "",
};
type UserForm = typeof emptyForm;

export default function ConfiguracoesPage() {
    const { data: session } = useSession();
    const isAdmin = (session?.user as { role?: string })?.role === "admin";
    const currentUserId = session?.user?.id;

    const [tab, setTab] = useState<"profile" | "users">("profile");
    const [userList, setUserList] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser] = useState<UserRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [form, setForm] = useState<UserForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (tab === "users" && isAdmin) loadUsers();
    }, [tab, isAdmin]);

    async function loadUsers() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) setUserList(await res.json());
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        setForm(emptyForm);
        setError(null);
        setShowCreate(true);
    }

    function openEdit(u: UserRecord) {
        setForm({ name: u.name || "", username: u.username, email: u.email, role: u.role, password: "", confirmPassword: "" });
        setError(null);
        setEditUser(u);
    }

    async function handleCreate() {
        setError(null);
        if (!form.username || !form.email || !form.password) {
            setError("Preencha todos os campos obrigatórios.");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("Senhas não coincidem.");
            return;
        }
        if (form.password.length < 8) {
            setError("Senha mínima de 8 caracteres.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name || undefined,
                    username: form.username,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Erro ao criar usuário."); return; }
            setShowCreate(false);
            loadUsers();
        } finally {
            setSaving(false);
        }
    }

    async function handleEdit() {
        if (!editUser) return;
        setError(null);
        if (form.password && form.password !== form.confirmPassword) {
            setError("Senhas não coincidem.");
            return;
        }
        if (form.password && form.password.length < 8) {
            setError("Senha mínima de 8 caracteres.");
            return;
        }
        setSaving(true);
        try {
            const body: Record<string, string | undefined> = {
                name: form.name || undefined,
                username: form.username,
                email: form.email,
                role: form.role,
            };
            if (form.password) body.password = form.password;
            const res = await fetch(`/api/admin/users/${editUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Erro ao atualizar usuário."); return; }
            setEditUser(null);
            loadUsers();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Erro ao deletar usuário.");
            return;
        }
        setDeleteId(null);
        loadUsers();
    }

    const tabs = [
        { key: "profile", label: "Meu perfil" },
        ...(isAdmin ? [{ key: "users", label: "Usuários" }] : []),
    ] as { key: "profile" | "users"; label: string }[];

    return (
        <div>
            <h1 className="text-h1 mb-6" style={{ color: "var(--text-primary)" }}>Configurações</h1>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 border-b" style={{ borderColor: "var(--border)" }}>
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className="px-4 py-2 text-[13px] -mb-px transition-colors"
                        style={{
                            color: tab === t.key ? "var(--text-primary)" : "var(--text-muted)",
                            borderBottom: tab === t.key ? "2px solid var(--text-primary)" : "2px solid transparent",
                            fontWeight: tab === t.key ? 500 : 400,
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Profile tab */}
            {tab === "profile" && (
                <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                    Em breve: editar nome, email e senha da sua conta.
                </div>
            )}

            {/* Users tab */}
            {tab === "users" && isAdmin && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                            {userList.length} {userList.length === 1 ? "usuário" : "usuários"}
                        </span>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] border text-[13px] transition-colors"
                            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                            <Plus size={14} /> Criar usuário
                        </button>
                    </div>

                    {loading ? (
                        <div className="h-[200px] flex items-center justify-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                            Carregando...
                        </div>
                    ) : (
                        <div className="rounded-[6px] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                            <table className="w-full text-[13px]">
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                                        <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Usuário</th>
                                        <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Email</th>
                                        <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Perfil</th>
                                        <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Criado em</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {userList.map((u, i) => (
                                        <tr key={u.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
                                                        style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                                                    >
                                                        {(u.name || u.username)[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{u.name || u.username}</div>
                                                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>@{u.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                                                    style={{
                                                        background: u.role === "admin" ? "rgba(99,102,241,0.15)" : "var(--bg-elevated)",
                                                        color: u.role === "admin" ? "#818cf8" : "var(--text-muted)",
                                                    }}
                                                >
                                                    {u.role === "admin" ? "Admin" : "User"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                                                {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEdit(u)}
                                                        className="p-1.5 rounded-[4px] transition-colors"
                                                        style={{ color: "var(--text-muted)" }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                                        title="Editar"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(u.id)}
                                                        disabled={u.id === currentUserId}
                                                        className="p-1.5 rounded-[4px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                        style={{ color: "var(--text-muted)" }}
                                                        onMouseEnter={(e) => { if (u.id !== currentUserId) { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "var(--accent-red)"; } }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                                        title={u.id === currentUserId ? "Não é possível deletar sua própria conta" : "Deletar"}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Create / Edit modal */}
            {(showCreate || editUser) && (
                <UserModal
                    title={showCreate ? "Criar usuário" : "Editar usuário"}
                    form={form}
                    isCreate={showCreate}
                    error={error}
                    saving={saving}
                    onChange={setForm}
                    onSave={showCreate ? handleCreate : handleEdit}
                    onClose={() => { setShowCreate(false); setEditUser(null); setError(null); }}
                />
            )}

            {/* Delete confirmation */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <div className="w-[360px] rounded-[6px] border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                        <h3 className="text-[15px] font-medium mb-2" style={{ color: "var(--text-primary)" }}>Deletar usuário</h3>
                        <p className="text-[13px] mb-6" style={{ color: "var(--text-secondary)" }}>
                            Esta ação removerá todos os dados do usuário — transações, orçamentos, metas e histórico de chat. Não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-[13px]"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className="px-4 py-2 rounded-[6px] text-[13px] font-medium"
                                style={{ background: "var(--accent-red)", color: "#fff" }}
                            >
                                Deletar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface UserModalProps {
    title: string;
    form: UserForm;
    isCreate: boolean;
    error: string | null;
    saving: boolean;
    onChange: (f: UserForm) => void;
    onSave: () => void;
    onClose: () => void;
}

function UserModal({ title, form, isCreate, error, saving, onChange, onSave, onClose }: UserModalProps) {
    const inp = "w-full px-3 py-2 rounded-[6px] border text-[13px] outline-none";
    const inpStyle = { background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" };
    const showConfirm = isCreate || !!form.password;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="w-[440px] rounded-[6px] border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[15px] font-medium" style={{ color: "var(--text-primary)" }}>{title}</h3>
                    <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={16} /></button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>
                                Nome <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                            </label>
                            <input
                                className={inp}
                                style={inpStyle}
                                value={form.name}
                                onChange={(e) => onChange({ ...form, name: e.target.value })}
                                placeholder="Nome completo"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Perfil</label>
                            <select
                                className={inp}
                                style={inpStyle}
                                value={form.role}
                                onChange={(e) => onChange({ ...form, role: e.target.value })}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Username *</label>
                        <input
                            className={inp}
                            style={inpStyle}
                            value={form.username}
                            onChange={(e) => onChange({ ...form, username: e.target.value })}
                            placeholder="username"
                            autoComplete="off"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Email *</label>
                        <input
                            type="email"
                            className={inp}
                            style={inpStyle}
                            value={form.email}
                            onChange={(e) => onChange({ ...form, email: e.target.value })}
                            placeholder="email@exemplo.com"
                            autoComplete="off"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>
                            {isCreate ? "Senha *" : "Nova senha"}
                            {!isCreate && (
                                <span style={{ color: "var(--text-muted)" }}> (deixe em branco para manter)</span>
                            )}
                        </label>
                        <input
                            type="password"
                            className={inp}
                            style={inpStyle}
                            value={form.password}
                            onChange={(e) => onChange({ ...form, password: e.target.value })}
                            placeholder={isCreate ? "Mínimo 8 caracteres" : "Nova senha (opcional)"}
                            autoComplete="new-password"
                        />
                    </div>

                    {showConfirm && (
                        <div>
                            <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>
                                Confirmar senha {isCreate && "*"}
                            </label>
                            <input
                                type="password"
                                className={inp}
                                style={inpStyle}
                                value={form.confirmPassword}
                                onChange={(e) => onChange({ ...form, confirmPassword: e.target.value })}
                                placeholder="Repita a senha"
                                autoComplete="new-password"
                            />
                        </div>
                    )}
                </div>

                {error && (
                    <div
                        className="mt-4 px-3 py-2 rounded-[6px] text-[12px]"
                        style={{ background: "rgba(239,68,68,0.1)", color: "var(--accent-red)" }}
                    >
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[13px]"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-[6px] text-[13px] font-medium disabled:opacity-40"
                        style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
                    >
                        {saving ? "Salvando..." : isCreate ? "Criar" : "Salvar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
