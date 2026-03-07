/**
 * Finance Friend — Sistema de Categorias (Fonte Única de Verdade)
 *
 * 20 categorias com subcategorias detalhadas, cores e funções de validação.
 */

// ─── Taxonomia Completa ──────────────────────────────────────────────────────

export interface CategoryInfo {
  subcategories: string[];
  color: { bg: string; text: string; dot: string };
  type: "despesa" | "receita" | "ambos";
}

export const CATEGORY_TAXONOMY: Record<string, CategoryInfo> = {
  // 1. Moradia
  "Moradia": {
    subcategories: [
      "Aluguel / Financiamento",
      "Condomínio",
      "Energia",
      "Água e Esgoto",
      "Gás",
      "Internet",
      "IPTU",
      "Manutenção e Reparos",
      "Móveis e Eletrodomésticos",
      "Serviços Domésticos",
    ],
    color: { bg: "rgba(139, 92, 246, 0.12)", text: "#8B5CF6", dot: "#8B5CF6" },
    type: "despesa",
  },

  // 2. Alimentação
  "Alimentação": {
    subcategories: [
      "Supermercado",
      "Hortifruti",
      "Restaurante",
      "Fast Food",
      "Delivery",
      "Padaria e Café",
      "Cafeteria",
      "Bar e Petisco",
    ],
    color: { bg: "rgba(245, 158, 11, 0.12)", text: "#F59E0B", dot: "#F59E0B" },
    type: "despesa",
  },

  // 3. Transporte
  "Transporte": {
    subcategories: [
      "Apps",
      "Combustível",
      "Estacionamento / Pedágio",
      "Transporte Público",
      "Ônibus Rodoviário",
      "Passagem Aérea",
      "Manutenção do Veículo",
      "Seguro do Veículo",
      "Documentação Veicular",
    ],
    color: { bg: "rgba(59, 130, 246, 0.12)", text: "#3B82F6", dot: "#3B82F6" },
    type: "despesa",
  },

  // 4. Contas e Utilidades
  "Contas e Utilidades": {
    subcategories: [
      "Internet Residencial",
      "Telefone e Celular",
      "TV por Assinatura",
      "Serviços de Nuvem",
      "Serviços Bancários",
    ],
    color: { bg: "rgba(100, 116, 139, 0.12)", text: "#64748B", dot: "#64748B" },
    type: "despesa",
  },

  // 5. Saúde e Bem-Estar
  "Saúde e Bem-Estar": {
    subcategories: [
      "Plano de Saúde",
      "Consulta Médica",
      "Farmácia",
      "Terapia / Psicólogo",
      "Academia",
      "Bem-estar",
    ],
    color: { bg: "rgba(229, 72, 77, 0.12)", text: "#E5484D", dot: "#E5484D" },
    type: "despesa",
  },

  // 6. Educação
  "Educação": {
    subcategories: [
      "Mensalidade Escolar / Faculdade",
      "Cursos e Treinamentos",
      "Livros e Materiais",
      "Papelaria",
    ],
    color: { bg: "rgba(6, 182, 212, 0.12)", text: "#06B6D4", dot: "#06B6D4" },
    type: "despesa",
  },

  // 7. Trabalho e Negócios
  "Trabalho e Negócios": {
    subcategories: [
      "Equipamentos de Trabalho",
      "Softwares e Ferramentas",
      "Transporte a Trabalho",
      "Alimentação no Trabalho",
      "Despesas MEI / PJ",
    ],
    color: { bg: "rgba(14, 165, 233, 0.12)", text: "#0EA5E9", dot: "#0EA5E9" },
    type: "despesa",
  },

  // 8. Lazer e Entretenimento
  "Lazer e Entretenimento": {
    subcategories: [
      "Viagem",
      "Bar e Balada",
      "Cinema e Teatro",
      "Jogos e Games",
      "Esporte",
      "Eventos e Festas",
    ],
    color: { bg: "rgba(0, 166, 126, 0.12)", text: "#00A67E", dot: "#00A67E" },
    type: "despesa",
  },

  // 9. Compras e E-commerce
  "Compras e E-commerce": {
    subcategories: [
      "Roupas e Calçados",
      "Beleza e Cosméticos",
      "Eletrônicos",
      "Casa e Decoração",
      "E-commerce Geral",
      "Presentes",
    ],
    color: { bg: "rgba(236, 72, 153, 0.12)", text: "#EC4899", dot: "#EC4899" },
    type: "despesa",
  },

  // 10. Família e Dependentes
  "Família e Dependentes": {
    subcategories: [
      "Despesas com Filhos",
      "Pensão / Manutenção",
      "Ajuda Financeira a Família",
    ],
    color: { bg: "rgba(249, 115, 22, 0.12)", text: "#F97316", dot: "#F97316" },
    type: "despesa",
  },

  // 11. Assinaturas e Serviços
  "Assinaturas e Serviços": {
    subcategories: [
      "Streaming",
      "SaaS e Ferramentas",
      "Telefone e Celular",
      "Seguro",
      "Clube de Benefícios",
      "Apps de Produtividade",
      "Jogos por Assinatura",
    ],
    color: { bg: "rgba(99, 102, 241, 0.12)", text: "#6366F1", dot: "#6366F1" },
    type: "despesa",
  },

  // 12. Impostos e Taxas
  "Impostos e Taxas": {
    subcategories: [
      "IOF",
      "Taxa Bancária",
      "Juros e Multas Bancárias",
      "Imposto de Renda",
      "Outros Impostos",
    ],
    color: { bg: "rgba(120, 113, 108, 0.12)", text: "#78716C", dot: "#78716C" },
    type: "despesa",
  },

  // 13. Dívidas e Crédito
  "Dívidas e Crédito": {
    subcategories: [
      "Pagamento de Fatura",
      "Empréstimo Pessoal",
      "Empréstimo Consignado",
      "Financiamento de Veículo",
      "Outras Dívidas",
      "Juros sobre Dívidas",
    ],
    color: { bg: "rgba(220, 38, 38, 0.12)", text: "#DC2626", dot: "#DC2626" },
    type: "despesa",
  },

  // 14. Investimentos e Patrimônio
  "Investimentos e Patrimônio": {
    subcategories: [
      "Renda Fixa",
      "Renda Variável",
      "Criptoativos",
      "Previdência Privada",
      "Outros Investimentos",
      "Corretagem e Taxas",
    ],
    color: { bg: "rgba(34, 197, 94, 0.12)", text: "#22C55E", dot: "#22C55E" },
    type: "ambos",
  },

  // 15. Poupança e Reservas
  "Poupança e Reservas": {
    subcategories: [
      "Reserva de Emergência",
      "Poupança Curto Prazo",
      "Cofrinhos / Caixinhas",
    ],
    color: { bg: "rgba(20, 184, 166, 0.12)", text: "#14B8A6", dot: "#14B8A6" },
    type: "despesa",
  },

  // 16. Transferências Pessoais
  "Transferências Pessoais": {
    subcategories: [
      "Transferência Própria",
      "Amigos",
      "Conhecidos",
      "Transferência para Terceiros",
      "Split de Contas",
    ],
    color: { bg: "rgba(168, 85, 247, 0.12)", text: "#A855F7", dot: "#A855F7" },
    type: "ambos",
  },

  // 17. Receita
  "Receita": {
    subcategories: [
      "Salário e Repasse",
      "Freelance",
      "Bônus / Comissões / PLR",
      "Receita de Investimentos",
      "Família",
      "Estorno",
      "Transferência Própria",
    ],
    color: { bg: "rgba(0, 166, 126, 0.12)", text: "#00A67E", dot: "#00A67E" },
    type: "receita",
  },

  // 18. Cartão de Crédito
  "Cartão de Crédito": {
    subcategories: [
      "Pagamento de Fatura",
      "Ajuste / Crédito",
      "Estorno em Fatura",
    ],
    color: { bg: "rgba(129, 140, 248, 0.12)", text: "#818CF8", dot: "#818CF8" },
    type: "ambos",
  },

  // 19. Outros / Não Classificável
  "Outros": {
    subcategories: [
      "Doações e Caridade",
      "Serviços Diversos",
      "Outros",
    ],
    color: { bg: "rgba(77, 82, 96, 0.12)", text: "#8A8F98", dot: "#4D5260" },
    type: "ambos",
  },

  // 20. Dúvida
  "Dúvida": {
    subcategories: [
      "Dúvida",
    ],
    color: { bg: "rgba(251, 191, 36, 0.12)", text: "#FBBF24", dot: "#FBBF24" },
    type: "ambos",
  },
};

// ─── Listas Derivadas ────────────────────────────────────────────────────────

export const ALL_CATEGORIES = Object.keys(CATEGORY_TAXONOMY);

export const EXPENSE_CATEGORIES = ALL_CATEGORIES.filter(
  (c) => CATEGORY_TAXONOMY[c].type === "despesa" || CATEGORY_TAXONOMY[c].type === "ambos"
);

export const INCOME_CATEGORIES = ALL_CATEGORIES.filter(
  (c) => CATEGORY_TAXONOMY[c].type === "receita" || CATEGORY_TAXONOMY[c].type === "ambos"
);

// ─── Mapeamento de Legado (Categorias Antigas → Novas) ──────────────────────

export const LEGACY_CATEGORY_MAP: Record<string, { category: string; subcategory?: string }> = {
  // Nomes antigos de categorias
  "Vestuário": { category: "Compras e E-commerce", subcategory: "Roupas e Calçados" },
  "Roupas": { category: "Compras e E-commerce", subcategory: "Roupas e Calçados" },
  "Saúde": { category: "Saúde e Bem-Estar" },
  "Assinaturas": { category: "Assinaturas e Serviços" },
  "Lazer": { category: "Lazer e Entretenimento" },
  "Salário": { category: "Receita", subcategory: "Salário e Repasse" },
  "Investimentos": { category: "Investimentos e Patrimônio" },
  "Elytra (Empresa)": { category: "Receita", subcategory: "Freelance" },
  // Nomes de categorias anteriores → novos (renomeações desta sprint)
  "Saúde e Bem-estar": { category: "Saúde e Bem-Estar" },
  "Assinaturas e Serviços Digitais": { category: "Assinaturas e Serviços" },
  "Lazer e Vida Social": { category: "Lazer e Entretenimento" },
  "Compras e Pessoais": { category: "Compras e E-commerce" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCategoryColor(category: string) {
  return CATEGORY_TAXONOMY[category]?.color || CATEGORY_TAXONOMY["Outros"].color;
}

export function getSubcategories(category: string): string[] {
  return CATEGORY_TAXONOMY[category]?.subcategories || [];
}

export function isValidCategory(category: string): boolean {
  return category in CATEGORY_TAXONOMY;
}

export function isValidSubcategory(category: string, subcategory: string): boolean {
  const subs = CATEGORY_TAXONOMY[category]?.subcategories;
  if (!subs) return false;
  return subs.includes(subcategory);
}

/**
 * Resolve uma categoria legada para o novo sistema.
 * Retorna a mesma se já for válida.
 */
export function resolveLegacyCategory(oldCategory: string): { category: string; subcategory?: string } {
  if (isValidCategory(oldCategory)) return { category: oldCategory };
  const mapped = LEGACY_CATEGORY_MAP[oldCategory];
  if (mapped) return mapped;
  return { category: "Outros" };
}

// ─── Cores para gráficos (20 cores distintas) ───────────────────────────────

export const CHART_COLORS = [
  "#8B5CF6", "#F59E0B", "#3B82F6", "#64748B", "#E5484D",
  "#06B6D4", "#0EA5E9", "#00A67E", "#EC4899", "#F97316",
  "#6366F1", "#78716C", "#DC2626", "#22C55E", "#14B8A6",
  "#A855F7", "#00A67E", "#818CF8", "#4D5260", "#FBBF24",
];
