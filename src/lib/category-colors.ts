export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    "Alimentação": { bg: "rgba(245, 158, 11, 0.12)", text: "#F59E0B", dot: "#F59E0B" },
    "Transporte": { bg: "rgba(59, 130, 246, 0.12)", text: "#3B82F6", dot: "#3B82F6" },
    "Moradia": { bg: "rgba(139, 92, 246, 0.12)", text: "#8B5CF6", dot: "#8B5CF6" },
    "Lazer": { bg: "rgba(0, 166, 126, 0.12)", text: "#00A67E", dot: "#00A67E" },
    "Assinaturas": { bg: "rgba(99, 102, 241, 0.12)", text: "#6366F1", dot: "#6366F1" },
    "Saúde": { bg: "rgba(229, 72, 77, 0.12)", text: "#E5484D", dot: "#E5484D" },
    "Educação": { bg: "rgba(6, 182, 212, 0.12)", text: "#06B6D4", dot: "#06B6D4" },
    "Salário": { bg: "rgba(0, 166, 126, 0.12)", text: "#00A67E", dot: "#00A67E" },
    "Receita": { bg: "rgba(0, 166, 126, 0.12)", text: "#00A67E", dot: "#00A67E" },
    "Roupas": { bg: "rgba(236, 72, 153, 0.12)", text: "#EC4899", dot: "#EC4899" },
    "Outros": { bg: "rgba(77, 82, 96, 0.12)", text: "#8A8F98", dot: "#4D5260" },
};

export const CHART_COLORS = ["#00A67E", "#3B82F6", "#F59E0B", "#7C3AED", "#E5484D", "#06B6D4", "#6366F1", "#EC4899"];

export function getCategoryColor(category: string) {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS["Outros"];
}

export const ALL_CATEGORIES = [
    "Alimentação", "Transporte", "Moradia", "Lazer", "Assinaturas",
    "Saúde", "Educação", "Roupas", "Salário", "Receita", "Outros",
];
