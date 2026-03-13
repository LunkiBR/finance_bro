"use client";

import { useCallback, useEffect, useState } from "react";
import { CategoryBadge, CategoryPicker } from "@/components/transactions/category-badge";
import { Plus, Trash2, Pencil, Zap, Search, ArrowRight } from "lucide-react";
import { CATEGORY_TAXONOMY } from "@/lib/categories";
import { getCategoryColor } from "@/lib/category-colors";

interface Rule {
  id: string;
  matchType: "exact" | "contains";
  matchString: string;
  targetCategory: string;
  targetSubcategory: string | null;
  priority: number;
  createdAt: string;
}

export default function AutomacoesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [newMatchType, setNewMatchType] = useState<"exact" | "contains">("contains");
  const [newMatchString, setNewMatchString] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState<string | undefined>();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [newPriority, setNewPriority] = useState(0);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMatchType, setEditMatchType] = useState<"exact" | "contains">("contains");
  const [editMatchString, setEditMatchString] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSubcategory, setEditSubcategory] = useState<string | undefined>();
  const [editPriority, setEditPriority] = useState(0);
  const [showEditCategoryPicker, setShowEditCategoryPicker] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rules");
      const data = await res.json();
      setRules(data.rules || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  async function createRule() {
    if (!newMatchString.trim() || !newCategory) return;
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchType: newMatchType,
        matchString: newMatchString.trim(),
        targetCategory: newCategory,
        targetSubcategory: newSubcategory || null,
        priority: newPriority,
      }),
    });
    setNewMatchString("");
    setNewCategory("");
    setNewSubcategory(undefined);
    setNewPriority(0);
    setShowCreate(false);
    fetchRules();
  }

  async function deleteRule(id: string) {
    await fetch(`/api/rules/${id}`, { method: "DELETE" });
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function startEdit(rule: Rule) {
    setEditingId(rule.id);
    setEditMatchType(rule.matchType);
    setEditMatchString(rule.matchString);
    setEditCategory(rule.targetCategory);
    setEditSubcategory(rule.targetSubcategory || undefined);
    setEditPriority(rule.priority);
  }

  async function saveEdit() {
    if (!editingId || !editMatchString.trim() || !editCategory) return;
    await fetch(`/api/rules/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchType: editMatchType,
        matchString: editMatchString.trim(),
        targetCategory: editCategory,
        targetSubcategory: editSubcategory || null,
        priority: editPriority,
      }),
    });
    setEditingId(null);
    fetchRules();
  }

  async function applyRule(id: string) {
    const res = await fetch("/api/rules/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId: id }),
    });
    const data = await res.json();
    if (data.updated > 0) {
      alert(`${data.updated} transação(ões) atualizada(s).`);
    } else {
      alert("Nenhuma transação correspondente encontrada.");
    }
  }

  const filteredRules = search
    ? rules.filter(
        (r) =>
          r.matchString.toLowerCase().includes(search.toLowerCase()) ||
          r.targetCategory.toLowerCase().includes(search.toLowerCase())
      )
    : rules;

  const exactCount = rules.filter((r) => r.matchType === "exact").length;
  const containsCount = rules.filter((r) => r.matchType === "contains").length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>
            Automações
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            Regras automáticas de categorização
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors"
          style={{
            background: showCreate ? "var(--bg-surface)" : "rgba(99, 102, 241, 0.12)",
            color: showCreate ? "var(--text-secondary)" : "#818CF8",
            border: showCreate ? "1px solid var(--border)" : "none",
          }}
        >
          {showCreate ? (
            "Cancelar"
          ) : (
            <>
              <Plus size={14} />
              Nova regra
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
          style={{ background: "var(--bg-surface)" }}
        >
          <Zap size={14} style={{ color: "#818CF8" }} />
          <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>{rules.length}</strong> regra
            {rules.length !== 1 && "s"} ativa{rules.length !== 1 && "s"}
          </span>
        </div>
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          {exactCount} exata{exactCount !== 1 && "s"} · {containsCount} flexíve
          {containsCount !== 1 ? "is" : "l"}
        </span>
      </div>

      {/* Create form */}
      {showCreate && (
        <div
          className="rounded-[8px] border p-4 mb-5"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <p
            className="text-[11px] font-semibold tracking-wide mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            NOVA REGRA
          </p>

          <div className="flex items-start gap-3 flex-wrap">
            {/* Match type */}
            <div className="flex rounded-[6px] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              {(["contains", "exact"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewMatchType(t)}
                  className="px-3 py-2 text-[12px] transition-colors"
                  style={{
                    background: newMatchType === t ? "var(--bg-elevated)" : "transparent",
                    color: newMatchType === t ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: newMatchType === t ? 500 : 400,
                  }}
                >
                  {t === "contains" ? "Contém" : "Exato"}
                </button>
              ))}
            </div>

            {/* Match string */}
            <input
              type="text"
              placeholder="Texto para corresponder..."
              value={newMatchString}
              onChange={(e) => setNewMatchString(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-[6px] border text-[13px]"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />

            <ArrowRight size={16} className="mt-2.5 shrink-0" style={{ color: "var(--text-muted)" }} />

            {/* Category picker */}
            <div className="relative">
              {newCategory ? (
                <CategoryBadge
                  category={newCategory}
                  subcategory={newSubcategory}
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                />
              ) : (
                <button
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="px-3 py-2 rounded-[6px] border text-[12px]"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  Selecionar categoria
                </button>
              )}
              {showCategoryPicker && (
                <CategoryPicker
                  current={newCategory}
                  currentSubcategory={newSubcategory}
                  onSelect={(cat, sub) => {
                    setNewCategory(cat);
                    setNewSubcategory(sub);
                    setShowCategoryPicker(false);
                  }}
                  onClose={() => setShowCategoryPicker(false)}
                />
              )}
            </div>

            {/* Priority */}
            <input
              type="number"
              placeholder="Prioridade"
              value={newPriority}
              onChange={(e) => setNewPriority(Number(e.target.value))}
              className="w-[80px] px-2 py-2 rounded-[6px] border text-[12px] text-center"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              title="Prioridade (maior = mais importante)"
            />

            <button
              onClick={createRule}
              disabled={!newMatchString.trim() || !newCategory}
              className="px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors disabled:opacity-40"
              style={{ background: "#6366F1", color: "#fff" }}
            >
              Criar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {rules.length > 5 && (
        <div className="relative mb-4 max-w-[280px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Filtrar regras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-[6px] border text-[13px]"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="flex items-center justify-center h-[200px]">
          <span className="text-body" style={{ color: "var(--text-muted)" }}>
            Carregando...
          </span>
        </div>
      ) : filteredRules.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center h-[300px] rounded-[8px] border"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          <Zap size={32} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
          <p className="text-[14px] mt-3" style={{ color: "var(--text-secondary)" }}>
            {search ? "Nenhuma regra encontrada" : "Nenhuma regra criada ainda"}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
            {search
              ? "Tente outro termo de busca."
              : "Altere a categoria de uma transação para criar regras automaticamente."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRules.map((rule) => {
            const isEditing = editingId === rule.id;
            const colors = getCategoryColor(rule.targetCategory);

            if (isEditing) {
              return (
                <div
                  key={rule.id}
                  className="rounded-[8px] border p-4"
                  style={{ background: "var(--bg-surface)", borderColor: "#6366F1" }}
                >
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex rounded-[6px] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                      {(["contains", "exact"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setEditMatchType(t)}
                          className="px-3 py-1.5 text-[12px] transition-colors"
                          style={{
                            background: editMatchType === t ? "var(--bg-elevated)" : "transparent",
                            color: editMatchType === t ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {t === "contains" ? "Contém" : "Exato"}
                        </button>
                      ))}
                    </div>
                    <input
                      value={editMatchString}
                      onChange={(e) => setEditMatchString(e.target.value)}
                      className="flex-1 min-w-[180px] px-3 py-1.5 rounded-[6px] border text-[13px]"
                      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                    <ArrowRight size={14} className="mt-2 shrink-0" style={{ color: "var(--text-muted)" }} />
                    <div className="relative">
                      <CategoryBadge
                        category={editCategory}
                        subcategory={editSubcategory}
                        onClick={() => setShowEditCategoryPicker(!showEditCategoryPicker)}
                      />
                      {showEditCategoryPicker && (
                        <CategoryPicker
                          current={editCategory}
                          currentSubcategory={editSubcategory}
                          onSelect={(cat, sub) => {
                            setEditCategory(cat);
                            setEditSubcategory(sub);
                            setShowEditCategoryPicker(false);
                          }}
                          onClose={() => setShowEditCategoryPicker(false)}
                        />
                      )}
                    </div>
                    <input
                      type="number"
                      value={editPriority}
                      onChange={(e) => setEditPriority(Number(e.target.value))}
                      className="w-[60px] px-2 py-1.5 rounded-[6px] border text-[12px] text-center"
                      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                      title="Prioridade"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium"
                        style={{ background: "#6366F1", color: "#fff" }}
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-[12px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={rule.id}
                className="group flex items-center gap-3 px-4 py-3 rounded-[8px] border transition-colors"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                {/* Match type badge */}
                <span
                  className="shrink-0 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold tracking-wide"
                  style={{
                    background: rule.matchType === "exact" ? "rgba(34,197,94,0.12)" : "rgba(59,130,246,0.12)",
                    color: rule.matchType === "exact" ? "#22C55E" : "#3B82F6",
                  }}
                >
                  {rule.matchType === "exact" ? "EXATO" : "CONTÉM"}
                </span>

                {/* Human-readable rule description */}
                <p className="flex-1 text-[13px] leading-[1.5]" style={{ color: "var(--text-secondary)" }}>
                  Quando a descrição{" "}
                  {rule.matchType === "exact" ? "for exatamente" : "contiver"}{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    &ldquo;{rule.matchString}&rdquo;
                  </strong>
                  , categorizar como
                </p>

                {/* Category badge */}
                <CategoryBadge
                  category={rule.targetCategory}
                  subcategory={rule.targetSubcategory}
                />

                {/* Priority */}
                {rule.priority > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-[3px]"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                    title="Prioridade"
                  >
                    P{rule.priority}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => applyRule(rule.id)}
                    className="p-1.5 rounded-[4px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(99,102,241,0.1)";
                      e.currentTarget.style.color = "#818CF8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                    title="Aplicar a transações existentes"
                  >
                    <Zap size={13} />
                  </button>
                  <button
                    onClick={() => startEdit(rule)}
                    className="p-1.5 rounded-[4px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-elevated)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                    title="Editar regra"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 rounded-[4px] transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(220,38,38,0.08)";
                      e.currentTarget.style.color = "#DC2626";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                    title="Excluir regra"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
