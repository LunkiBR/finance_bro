"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, X, Check, Ban, RotateCcw, Camera, Copy, ChevronDown, ChevronUp } from "lucide-react";

interface UserRecord {
    id: string;
    name: string | null;
    username: string;
    email: string;
    role: string;
    status: string;
    avatarUrl: string | null;
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

// ─── Status helpers ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { label: string; bg: string; color: string }> = {
        active: { label: "Ativo", bg: "rgba(34,197,94,0.12)", color: "#4ade80" },
        pending: { label: "Pendente", bg: "rgba(234,179,8,0.12)", color: "#eab308" },
        suspended: { label: "Suspenso", bg: "rgba(239,68,68,0.1)", color: "var(--accent-red)" },
    };
    const c = cfg[status] ?? { label: status, bg: "var(--bg-elevated)", color: "var(--text-muted)" };
    return (
        <span
            className="px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: c.bg, color: c.color }}
        >
            {c.label}
        </span>
    );
}

// ─── Avatar helper ───────────────────────────────────────────────────────────

function Avatar({ src, name, size = 28 }: { src?: string | null; name: string; size?: number }) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className="rounded-full object-cover shrink-0"
                style={{ width: size, height: size }}
            />
        );
    }
    return (
        <div
            className="rounded-full flex items-center justify-center shrink-0"
            style={{
                width: size,
                height: size,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: size * 0.38,
                fontWeight: 500,
            }}
        >
            {name[0]?.toUpperCase() ?? "?"}
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
    const { data: session, update: updateSession } = useSession();
    const isAdmin = (session?.user as { role?: string })?.role === "admin";
    const currentUserId = session?.user?.id;

    const [tab, setTab] = useState<"profile" | "users">("profile");

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

            {tab === "profile" && (
                <ProfileTab
                    sessionUserId={currentUserId}
                    sessionAvatarUrl={(session?.user as { avatarUrl?: string | null })?.avatarUrl}
                    onSaved={() => updateSession()}
                />
            )}

            {tab === "users" && isAdmin && (
                <UsersTab currentUserId={currentUserId} />
            )}
        </div>
    );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({
    sessionUserId,
    sessionAvatarUrl,
    onSaved,
}: {
    sessionUserId?: string;
    sessionAvatarUrl?: string | null;
    onSaved: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<{
        id: string;
        name: string | null;
        username: string;
        email: string;
        role: string;
        avatarUrl: string | null;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarChanged, setAvatarChanged] = useState(false);

    // Password section
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data) => {
                setProfile(data);
                setName(data.name ?? "");
                setUsername(data.username ?? "");
                setEmail(data.email ?? "");
                setAvatarPreview(data.avatarUrl ?? null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const src = ev.target?.result as string;
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
                setAvatarChanged(true);
            };
            img.src = src;
        };
        reader.readAsDataURL(file);
    }

    function copyId() {
        if (!profile?.id) return;
        navigator.clipboard.writeText(profile.id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    async function handleSave() {
        setError(null);
        setSuccess(false);

        if (showPasswordSection) {
            if (newPassword && newPassword !== confirmNewPassword) {
                setError("As novas senhas não coincidem.");
                return;
            }
            if (newPassword && newPassword.length < 8) {
                setError("Nova senha deve ter no mínimo 8 caracteres.");
                return;
            }
        }

        setSaving(true);
        try {
            const body: Record<string, unknown> = {
                name: name || null,
                username,
                email,
            };
            if (avatarChanged) body.avatarUrl = avatarPreview;
            if (showPasswordSection && newPassword) {
                body.currentPassword = currentPassword;
                body.newPassword = newPassword;
            }

            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Erro ao salvar.");
                return;
            }
            setProfile(data);
            setAvatarChanged(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            onSaved();
        } finally {
            setSaving(false);
        }
    }

    const inp = "w-full px-3 py-2 rounded-[6px] border text-[13px] outline-none transition-colors";
    const inpStyle = { background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" };

    if (loading) {
        return (
            <div className="h-[200px] flex items-center justify-center text-[13px]" style={{ color: "var(--text-muted)" }}>
                Carregando...
            </div>
        );
    }

    return (
        <div className="max-w-[480px] space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group shrink-0"
                    title="Alterar foto"
                >
                    <div
                        className="w-[80px] h-[80px] rounded-full overflow-hidden flex items-center justify-center"
                        style={{ background: "var(--bg-elevated)", border: "2px solid var(--border)" }}
                    >
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[28px] font-medium" style={{ color: "var(--text-primary)" }}>
                                {(name || username || "?")[0]?.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div
                        className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.45)" }}
                    >
                        <Camera size={18} color="#fff" />
                    </div>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

                <div>
                    <div className="text-[15px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {name || username}
                    </div>
                    <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>@{username}</div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 text-[12px] transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
                    >
                        Alterar foto
                    </button>
                </div>
            </div>

            {/* Name */}
            <div>
                <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Como quer ser chamado
                </label>
                <input
                    className={inp}
                    style={inpStyle}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
            </div>

            {/* Username */}
            <div>
                <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Username <span style={{ color: "var(--text-muted)" }}>(seu @handle)</span>
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] select-none" style={{ color: "var(--text-muted)" }}>@</span>
                    <input
                        className={inp}
                        style={{ ...inpStyle, paddingLeft: "24px" }}
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        placeholder="seu.usuario"
                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                    />
                </div>
            </div>

            {/* Email */}
            <div>
                <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input
                    type="email"
                    className={inp}
                    style={inpStyle}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
            </div>

            {/* User ID */}
            <div>
                <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Seu ID <span style={{ color: "var(--text-muted)" }}>(read-only)</span>
                </label>
                <div className="flex items-center gap-2">
                    <div
                        className="flex-1 px-3 py-2 rounded-[6px] border text-[12px] font-mono truncate"
                        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                        {profile?.id ?? sessionUserId ?? "—"}
                    </div>
                    <button
                        type="button"
                        onClick={copyId}
                        className="p-2 rounded-[6px] border transition-colors"
                        style={{ borderColor: "var(--border)", color: copied ? "#4ade80" : "var(--text-muted)" }}
                        title="Copiar ID"
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <Copy size={14} />
                    </button>
                </div>
            </div>

            {/* Password section */}
            <div
                className="rounded-[6px] border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
            >
                <button
                    type="button"
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="w-full flex items-center justify-between px-4 py-3 text-[13px] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                    Alterar senha
                    {showPasswordSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showPasswordSection && (
                    <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="pt-3">
                            <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Senha atual</label>
                            <input
                                type="password"
                                className={inp}
                                style={inpStyle}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Sua senha atual"
                                autoComplete="current-password"
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Nova senha</label>
                            <input
                                type="password"
                                className={inp}
                                style={inpStyle}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                autoComplete="new-password"
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Confirmar nova senha</label>
                            <input
                                type="password"
                                className={inp}
                                style={inpStyle}
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="Repita a nova senha"
                                autoComplete="new-password"
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Error / Success */}
            {error && (
                <div className="px-3 py-2 rounded-[6px] text-[12px]" style={{ background: "rgba(239,68,68,0.1)", color: "var(--accent-red)" }}>
                    {error}
                </div>
            )}
            {success && (
                <div className="px-3 py-2 rounded-[6px] text-[12px]" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>
                    Perfil atualizado com sucesso.
                </div>
            )}

            {/* Save */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-[6px] text-[13px] font-medium transition-all disabled:opacity-40"
                style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
            >
                {saving ? "Salvando..." : "Salvar alterações"}
            </button>
        </div>
    );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId?: string }) {
    const [userList, setUserList] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser] = useState<UserRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [form, setForm] = useState<UserForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { loadUsers(); }, []);

    async function loadUsers() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) setUserList(await res.json());
        } finally {
            setLoading(false);
        }
    }

    function openCreate() { setForm(emptyForm); setError(null); setShowCreate(true); }
    function openEdit(u: UserRecord) {
        setForm({ name: u.name || "", username: u.username, email: u.email, role: u.role, password: "", confirmPassword: "" });
        setError(null);
        setEditUser(u);
    }

    async function handleCreate() {
        setError(null);
        if (!form.username || !form.email || !form.password) { setError("Preencha todos os campos obrigatórios."); return; }
        if (form.password !== form.confirmPassword) { setError("Senhas não coincidem."); return; }
        if (form.password.length < 8) { setError("Senha mínima de 8 caracteres."); return; }
        setSaving(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: form.name || undefined, username: form.username, email: form.email, password: form.password, role: form.role }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Erro ao criar usuário."); return; }
            setShowCreate(false);
            loadUsers();
        } finally { setSaving(false); }
    }

    async function handleEdit() {
        if (!editUser) return;
        setError(null);
        if (form.password && form.password !== form.confirmPassword) { setError("Senhas não coincidem."); return; }
        if (form.password && form.password.length < 8) { setError("Senha mínima de 8 caracteres."); return; }
        setSaving(true);
        try {
            const body: Record<string, string | undefined> = { name: form.name || undefined, username: form.username, email: form.email, role: form.role };
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
        } finally { setSaving(false); }
    }

    async function handleDelete(id: string) {
        const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
        if (!res.ok) { const d = await res.json(); alert(d.error || "Erro ao deletar."); return; }
        setDeleteId(null);
        loadUsers();
    }

    async function setStatus(id: string, status: string) {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (res.ok) loadUsers();
    }

    const pendingUsers = userList.filter((u) => u.status === "pending");

    return (
        <div>
            {/* Pending approval banner */}
            {pendingUsers.length > 0 && (
                <div
                    className="mb-5 px-4 py-3 rounded-[6px] border text-[13px]"
                    style={{ background: "rgba(234,179,8,0.08)", borderColor: "rgba(234,179,8,0.25)", color: "#eab308" }}
                >
                    {pendingUsers.length} {pendingUsers.length === 1 ? "conta aguardando" : "contas aguardando"} aprovação
                </div>
            )}

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
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Criado em</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {userList.map((u, i) => (
                                <tr
                                    key={u.id}
                                    style={{
                                        borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                                        borderLeft: u.status === "pending" ? "3px solid rgba(234,179,8,0.5)" : undefined,
                                    }}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar src={u.avatarUrl} name={u.name || u.username} size={28} />
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
                                    <td className="px-4 py-3">
                                        <StatusBadge status={u.status} />
                                    </td>
                                    <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>
                                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* Status actions */}
                                            {u.status === "pending" && (
                                                <>
                                                    <button
                                                        onClick={() => setStatus(u.id, "active")}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-[11px] font-medium transition-colors"
                                                        style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}
                                                        title="Aprovar"
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.2)"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.12)"; }}
                                                    >
                                                        <Check size={12} /> Aprovar
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(u.id)}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-[11px] transition-colors"
                                                        style={{ background: "rgba(239,68,68,0.08)", color: "var(--accent-red)" }}
                                                        title="Rejeitar"
                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                                                    >
                                                        <X size={12} /> Rejeitar
                                                    </button>
                                                </>
                                            )}
                                            {u.status === "active" && u.id !== currentUserId && (
                                                <button
                                                    onClick={() => setStatus(u.id, "suspended")}
                                                    className="p-1.5 rounded-[4px] transition-colors"
                                                    style={{ color: "var(--text-muted)" }}
                                                    title="Suspender"
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "var(--accent-red)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                                >
                                                    <Ban size={14} />
                                                </button>
                                            )}
                                            {u.status === "suspended" && (
                                                <button
                                                    onClick={() => setStatus(u.id, "active")}
                                                    className="p-1.5 rounded-[4px] transition-colors"
                                                    style={{ color: "var(--text-muted)" }}
                                                    title="Reativar"
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.1)"; e.currentTarget.style.color = "#4ade80"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                                >
                                                    <RotateCcw size={14} />
                                                </button>
                                            )}

                                            {/* Edit */}
                                            <button
                                                onClick={() => openEdit(u)}
                                                className="p-1.5 rounded-[4px] transition-colors"
                                                style={{ color: "var(--text-muted)" }}
                                                title="Editar"
                                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                            >
                                                <Pencil size={14} />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => setDeleteId(u.id)}
                                                disabled={u.id === currentUserId}
                                                className="p-1.5 rounded-[4px] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                style={{ color: "var(--text-muted)" }}
                                                title={u.id === currentUserId ? "Não é possível deletar sua própria conta" : "Deletar"}
                                                onMouseEnter={(e) => { if (u.id !== currentUserId) { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "var(--accent-red)"; } }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
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
                        <h3 className="text-[15px] font-medium mb-2" style={{ color: "var(--text-primary)" }}>Deletar / Rejeitar usuário</h3>
                        <p className="text-[13px] mb-6" style={{ color: "var(--text-secondary)" }}>
                            Esta ação removerá todos os dados do usuário. Não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
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

// ─── User Create/Edit Modal ───────────────────────────────────────────────────

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
                            <input className={inp} style={inpStyle} value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="Nome" />
                        </div>
                        <div>
                            <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Perfil</label>
                            <select className={inp} style={inpStyle} value={form.role} onChange={(e) => onChange({ ...form, role: e.target.value })}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Username *</label>
                        <input className={inp} style={inpStyle} value={form.username} onChange={(e) => onChange({ ...form, username: e.target.value })} placeholder="username" autoComplete="off" />
                    </div>

                    <div>
                        <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Email *</label>
                        <input type="email" className={inp} style={inpStyle} value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} placeholder="email@exemplo.com" autoComplete="off" />
                    </div>

                    <div>
                        <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>
                            {isCreate ? "Senha *" : "Nova senha"}
                            {!isCreate && <span style={{ color: "var(--text-muted)" }}> (deixe em branco para manter)</span>}
                        </label>
                        <input type="password" className={inp} style={inpStyle} value={form.password} onChange={(e) => onChange({ ...form, password: e.target.value })} placeholder={isCreate ? "Mínimo 8 caracteres" : "Nova senha (opcional)"} autoComplete="new-password" />
                    </div>

                    {showConfirm && (
                        <div>
                            <label className="block text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Confirmar senha {isCreate && "*"}</label>
                            <input type="password" className={inp} style={inpStyle} value={form.confirmPassword} onChange={(e) => onChange({ ...form, confirmPassword: e.target.value })} placeholder="Repita a senha" autoComplete="new-password" />
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 px-3 py-2 rounded-[6px] text-[12px]" style={{ background: "rgba(239,68,68,0.1)", color: "var(--accent-red)" }}>
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>Cancelar</button>
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
