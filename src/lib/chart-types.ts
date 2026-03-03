/**
 * Contrato compartilhado entre o AI Copilot e o frontend.
 * Claude retorna um ChartSpec → frontend renderiza via Recharts.
 */

export type ChartType = "bar" | "line" | "pie" | "area";

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number; // campos extras para multi-série
}

export interface ChartSpec {
  type: ChartType;
  title: string;
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  // Para múltiplas séries (ex: receita vs despesa por mês)
  series?: Array<{ key: string; color: string; label: string }>;
}
