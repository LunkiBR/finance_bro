"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Lock, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { CategoryForm } from "@/components/categories/category-form";
import { deriveColors } from "@/components/categories/color-picker";
import type { MergedCategoryInfo } from "@/lib/categories";

interface UserCategoryRow {
  id: string;
  name: string;
  type: string;
  parent: string | null;
  subcategories: string[];
  colorBg: string | null;
  colorText: string | null;
  colorDot: string | null;
  icon: string;
  aiContext: string | null;
  aiExamples: string[] | null;
  sortOrder: number;
}

export default function CategoriasPage() {
  const [taxonomy, setTaxonomy] = useState<Record<string, MergedCategoryInfo>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UserCategoryRow | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setTaxonomy(data);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categories = Object.entries(taxonomy);
  const filtered = search
    ? categories.filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const parentOptions = categories
    .filter(([, info]) => !info.isCustom || !("parent" in info))
    .map(([name]) => name);

  async function handleCreate(data: Parameters<typeof CategoryForm>[0] extends { onSubmit: (d: infer D) => void } ? D : never) {
    const colors = deriveColors(data.colorDot);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        type: data.type,
        parent: data.parent,
        subcategories: data.subcategories,
        colorBg: colors.bg,
        colorText: colors.text,
        colorDot: colors.dot,
        icon: data.icon,
        aiContext: data.aiContext,
        aiExamples: data.aiExamples,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      fetchCategories();
    }
  }

  async function handleEdit(data: Parameters<typeof handleCreate>[0]) {
    if (!editingCategory) return;
    const colors = deriveColors(data.colorDot);
    const res = await fetch(`/api/categories/${editingCategory.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        type: data.type,
        parent: data.parent,
        subcategories: data.subcategories,
        colorBg: colors.bg,
        colorText: colors.text,
        colorDot: colors.dot,
        icon: data.icon,
        aiContext: data.aiContext,
        aiExamples: data.aiExamples,
      }),
    });
    if (res.ok) {
      setEditingCategory(null);
      fetchCategories();
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Desativar categoria "${name}"? Transações existentes mantêm a categoria.`)) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  }

  function startEdit(name: string, info: MergedCategoryInfo) {
    setEditingCategory({
      id: info.id!,
      name,
      type: info.type,
      parent: null,
      subcategories: info.subcategories,
      colorBg: info.color.bg,
      colorText: info.color.text,
      colorDot: info.color.dot,
      icon: info.icon,
      aiContext: info.aiContext || null,
      aiExamples: info.aiExamples || null,
      sortOrder: 100,
    });
  }

  return (
    <div className="flex-1 p-6 max-w-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="text-[18px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Categorias
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Personalize suas categorias e ajude a IA a categorizar melhor.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium"
          style={{
            background: "var(--text-primary)",
            color: "var(--bg-base)",
          }}
        >
          <Plus size={14} />
          Nova Categoria
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar categoria..."
          className="w-full pl-8 pr-3 py-2 rounded-[6px] border text-[13px]"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          Carregando...
        </div>
      ) : (
        <div className="space-y-[2px]">
          {filtered.map(([name, info]) => {
            const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[info.icon] || LucideIcons.MoreHorizontal;
            return (
              <div
                key={name}
                className="flex items-center gap-3 px-4 py-3 rounded-[6px] group transition-colors"
                style={{ background: "var(--bg-surface)" }}
              >
                {/* Icon + Color dot */}
                <div
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0"
                  style={{ background: info.color.bg }}
                >
                  <Icon size={16} style={{ color: info.color.dot }} />
                </div>

                {/* Name + metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[13px] font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {name}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-[1px] rounded-[3px]"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {info.type}
                    </span>
                    {info.isCustom && (
                      <Sparkles size={12} style={{ color: "var(--accent-amber)" }} />
                    )}
                    {!info.isCustom && (
                      <Lock size={10} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                    )}
                  </div>
                  <div
                    className="text-[11px] truncate mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {info.subcategories.slice(0, 5).join(", ")}
                    {info.subcategories.length > 5 && ` +${info.subcategories.length - 5}`}
                  </div>
                  {info.aiContext && (
                    <div
                      className="text-[10px] mt-0.5 truncate"
                      style={{ color: "var(--accent-blue)", opacity: 0.7 }}
                    >
                      IA: {info.aiContext}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {info.isCustom && info.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(name, info)}
                      className="p-1.5 rounded-[4px] transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(info.id!, name)}
                      className="p-1.5 rounded-[4px] transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      title="Desativar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <CategoryForm
          parentOptions={parentOptions}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editingCategory && (
        <CategoryForm
          initial={{
            name: editingCategory.name,
            type: editingCategory.type as "despesa" | "receita" | "ambos",
            parent: editingCategory.parent,
            subcategories: editingCategory.subcategories || [],
            colorDot: editingCategory.colorDot || "#3B82F6",
            icon: editingCategory.icon,
            aiContext: editingCategory.aiContext || "",
            aiExamples: editingCategory.aiExamples || [],
          }}
          parentOptions={parentOptions}
          onSubmit={handleEdit}
          onCancel={() => setEditingCategory(null)}
          isEditing
        />
      )}
    </div>
  );
}
