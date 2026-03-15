/**
 * Ícones curados do Lucide React para o picker de categorias.
 * ~50 ícones organizados por grupo temático.
 */

export interface IconGroup {
  group: string;
  icons: string[];
}

export const ICON_PICKER_OPTIONS: IconGroup[] = [
  {
    group: "Dinheiro",
    icons: ["DollarSign", "CreditCard", "Wallet", "PiggyBank", "TrendingUp", "Coins", "Banknote", "Receipt"],
  },
  {
    group: "Casa",
    icons: ["Home", "Sofa", "Lightbulb", "Wrench", "Key", "Bath"],
  },
  {
    group: "Alimentação",
    icons: ["Utensils", "Coffee", "Pizza", "Apple", "Wine", "CookingPot", "Salad", "Beef"],
  },
  {
    group: "Transporte",
    icons: ["Car", "Bus", "Bike", "Plane", "Train", "Fuel", "MapPin"],
  },
  {
    group: "Saúde",
    icons: ["HeartPulse", "Pill", "Stethoscope", "Dumbbell", "Activity"],
  },
  {
    group: "Educação",
    icons: ["GraduationCap", "Book", "BookOpen", "Pencil", "School"],
  },
  {
    group: "Lazer",
    icons: ["Ticket", "Gamepad2", "Music", "Tv", "Film", "Popcorn", "PartyPopper"],
  },
  {
    group: "Compras",
    icons: ["ShoppingCart", "ShoppingBag", "Gift", "Shirt", "Sparkles"],
  },
  {
    group: "Trabalho",
    icons: ["Briefcase", "Monitor", "Laptop", "Code", "Building2"],
  },
  {
    group: "Geral",
    icons: ["Tag", "Star", "Flag", "Bookmark", "Folder", "Box", "Package", "MoreHorizontal", "HelpCircle", "CircleDot"],
  },
  {
    group: "Pessoas",
    icons: ["Users", "User", "Baby", "Heart", "HandHeart"],
  },
  {
    group: "Natureza",
    icons: ["Dog", "Cat", "PawPrint", "Leaf", "Sun"],
  },
];

export const ALL_PICKER_ICONS = ICON_PICKER_OPTIONS.flatMap(g => g.icons);
