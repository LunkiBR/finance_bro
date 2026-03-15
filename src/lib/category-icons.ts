import {
  Home,
  Utensils,
  Car,
  Wifi,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Ticket,
  ShoppingCart,
  Users,
  PlaySquare,
  Landmark,
  CreditCard,
  TrendingUp,
  PiggyBank,
  ArrowRightLeft,
  DollarSign,
  MoreHorizontal,
  HelpCircle,
  LucideIcon
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Moradia": Home,
  "Alimentação": Utensils,
  "Transporte": Car,
  "Contas e Utilidades": Wifi,
  "Saúde e Bem-Estar": HeartPulse,
  "Educação": GraduationCap,
  "Trabalho e Negócios": Briefcase,
  "Lazer e Entretenimento": Ticket,
  "Compras e E-commerce": ShoppingCart,
  "Família e Dependentes": Users,
  "Assinaturas e Serviços": PlaySquare,
  "Impostos e Taxas": Landmark,
  "Dívidas e Crédito": CreditCard,
  "Investimentos e Patrimônio": TrendingUp,
  "Poupança e Reservas": PiggyBank,
  "Transferências Pessoais": ArrowRightLeft,
  "Receita": DollarSign,
  "Cartão de Crédito": CreditCard,
  "Outros": MoreHorizontal,
  "Dúvida": HelpCircle,
};

/**
 * Retorna o ícone de uma categoria.
 * @param category - nome da categoria
 * @param iconName - nome string do Lucide icon (para categorias custom)
 * @param fallbackIcon - fallback
 */
export function getCategoryIcon(category: string, iconName?: string, fallbackIcon: LucideIcon = MoreHorizontal): LucideIcon {
  // 1. Se iconName fornecido (custom), tenta lookup dinâmico
  if (iconName) {
    // Lazy require para evitar bundle completo do Lucide no client
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const icons = require("lucide-react") as Record<string, LucideIcon>;
    if (icons[iconName]) return icons[iconName];
  }
  // 2. Hardcoded defaults
  return CATEGORY_ICONS[category] || fallbackIcon;
}
