"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { IconPicker } from "./icon-picker";
import { ColorPicker, deriveColors } from "./color-picker";

interface CategoryFormData {
  name: string;
  type: "despesa" | "receita" | "ambos";
  parent: string | null;
  subcategories: string[];
  colorDot: string;
  icon: string;
  aiContext: string;
  aiExamples: string[];
}

interface CategoryFormProps {
  initial?: Partial<CategoryFormData>;
  parentOptions: string[]; // lista de categorias raiz disponíveis
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function CategoryForm({ initial, parentOptions, onSubmit, onCancel, isEditing }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<"despesa" | "receita" | "ambos">(initial?.type || "despesa");
  const [parent, setParent] = useState<string | null>(initial?.parent ?? null);
  const [subcategories, setSubcategories] = useState<string[]>(initial?.subcategories || []);
  const [colorDot, setColorDot] = useState(initial?.colorDot || "#3B82F6");
  const [icon, setIcon] = useState(initial?.icon || "Tag");
  const [aiContext, setAiContext] = useState(initial?.aiContext || "");
  const [aiExamples, setAiExamples] = useState<string[]>(initial?.aiExamples || []);

  const [newSub, setNewSub] = useState("");
  const [newExample, setNewExample] = useState("");

  function addTag(list: string[], setter: (v: string[]) => void, value: string, inputSetter: (v: string) => void) {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
    inputSetter("");
  }

  function removeTag(list: string[], setter: (v: string[]) => void, index: number) {
    setter(list.filter((_, i) => i !== index));
  }

  const derivedColor = deriveColors(colorDot);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-[10px] border w-full max-w-[480px] max-h-[85vh] overflow-y-auto mx-4"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-[15px] font-medium" style={{ color: "var(--text-primary)" }}>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <button onClick={onCancel} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: RU, Pet, Freelance Extra..."
              className="w-full px-3 py-2 rounded-[6px] border text-[13px]"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Tipo + Categoria Pai */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="w-full px-3 py-2 rounded-[6px] border text-[13px]"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Categoria Pai
              </label>
              <select
                value={parent || ""}
                onChange={(e) => setParent(e.target.value || null)}
                className="w-full px-3 py-2 rounded-[6px] border text-[13px]"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="">Nenhuma (raiz)</option>
                {parentOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subcategorias — só se for raiz */}
          {!parent && (
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Subcategorias
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {subcategories.map((sub, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[4px] text-[11px]"
                    style={{ background: derivedColor.bg, color: derivedColor.text }}
                  >
                    {sub}
                    <button type="button" onClick={() => removeTag(subcategories, setSubcategories, i)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(subcategories, setSubcategories, newSub, setNewSub))}
                  placeholder="Digitar + Enter"
                  className="flex-1 px-3 py-1.5 rounded-[6px] border text-[12px]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => addTag(subcategories, setSubcategories, newSub, setNewSub)}
                  className="px-2 rounded-[6px] border"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Cor + Ícone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Cor
              </label>
              <ColorPicker selected={colorDot} onSelect={setColorDot} />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Ícone
              </label>
              <IconPicker selected={icon} onSelect={setIcon} color={colorDot} />
            </div>
          </div>

          {/* Contexto para IA */}
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Contexto para IA
            </label>
            <p className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)" }}>
              Descreva o que essa categoria representa para a IA entender e categorizar corretamente.
            </p>
            <textarea
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              placeholder="Ex: Restaurante Universitário da UNICAMP. Refeições subsidiadas no campus."
              rows={2}
              className="w-full px-3 py-2 rounded-[6px] border text-[13px] resize-none"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Exemplos de transações */}
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Exemplos no extrato
            </label>
            <p className="text-[11px] mb-1.5" style={{ color: "var(--text-muted)" }}>
              Como essas transações aparecem no extrato bancário? A IA usa isso para categorizar automaticamente.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {aiExamples.map((ex, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[4px] text-[11px] font-mono"
                  style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                >
                  {ex}
                  <button type="button" onClick={() => removeTag(aiExamples, setAiExamples, i)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(aiExamples, setAiExamples, newExample, setNewExample))}
                placeholder="Ex: RU UNICAMP, REST UNIVERSITARIO"
                className="flex-1 px-3 py-1.5 rounded-[6px] border text-[12px] font-mono"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => addTag(aiExamples, setAiExamples, newExample, setNewExample)}
                className="px-2 rounded-[6px] border"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-[6px] text-[13px]"
            style={{ color: "var(--text-secondary)" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              const colors = deriveColors(colorDot);
              onSubmit({
                name: name.trim(),
                type,
                parent,
                subcategories,
                colorDot: colors.dot,
                icon,
                aiContext: aiContext.trim(),
                aiExamples: aiExamples.filter(Boolean),
              });
            }}
            className="px-4 py-1.5 rounded-[6px] text-[13px] font-medium"
            style={{
              background: "var(--text-primary)",
              color: "var(--bg-base)",
            }}
          >
            {isEditing ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
