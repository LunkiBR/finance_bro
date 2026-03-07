/**
 * Seed das regras de categorização — 20 categorias com subcategorias.
 *
 * Rodar: npx tsx src/db/seed-rules.ts
 */

import { db, categoryRules } from "./index";

type Rule = {
  keyword: string;
  category: string;
  subcategory: string;
  type: "receita" | "despesa";
  priority: number;
};

const rules: Rule[] = [
  // ═══════════════════════════════════════════════════════════════════════════════
  // 1. MORADIA
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "aluguel", category: "Moradia", subcategory: "Aluguel / Financiamento", type: "despesa", priority: 100 },
  { keyword: "financiamento imob", category: "Moradia", subcategory: "Aluguel / Financiamento", type: "despesa", priority: 100 },
  { keyword: "condomínio", category: "Moradia", subcategory: "Condomínio", type: "despesa", priority: 100 },
  { keyword: "condominio", category: "Moradia", subcategory: "Condomínio", type: "despesa", priority: 100 },
  { keyword: "energia elétrica", category: "Moradia", subcategory: "Energia", type: "despesa", priority: 100 },
  { keyword: "enel", category: "Moradia", subcategory: "Energia", type: "despesa", priority: 100 },
  { keyword: "cpfl", category: "Moradia", subcategory: "Energia", type: "despesa", priority: 100 },
  { keyword: "cemig", category: "Moradia", subcategory: "Energia", type: "despesa", priority: 100 },
  { keyword: "light", category: "Moradia", subcategory: "Energia", type: "despesa", priority: 90 },
  { keyword: "sabesp", category: "Moradia", subcategory: "Água e Esgoto", type: "despesa", priority: 100 },
  { keyword: "copasa", category: "Moradia", subcategory: "Água e Esgoto", type: "despesa", priority: 100 },
  { keyword: "sanepar", category: "Moradia", subcategory: "Água e Esgoto", type: "despesa", priority: 100 },
  { keyword: "água e esgoto", category: "Moradia", subcategory: "Água e Esgoto", type: "despesa", priority: 100 },
  { keyword: "comgás", category: "Moradia", subcategory: "Gás", type: "despesa", priority: 100 },
  { keyword: "gás encanado", category: "Moradia", subcategory: "Gás", type: "despesa", priority: 100 },
  { keyword: "botijão", category: "Moradia", subcategory: "Gás", type: "despesa", priority: 90 },
  { keyword: "iptu", category: "Moradia", subcategory: "IPTU", type: "despesa", priority: 100 },
  { keyword: "reforma", category: "Moradia", subcategory: "Manutenção e Reparos", type: "despesa", priority: 80 },
  { keyword: "encanador", category: "Moradia", subcategory: "Manutenção e Reparos", type: "despesa", priority: 90 },
  { keyword: "eletricista", category: "Moradia", subcategory: "Manutenção e Reparos", type: "despesa", priority: 90 },
  { keyword: "diarista", category: "Moradia", subcategory: "Serviços Domésticos", type: "despesa", priority: 90 },
  { keyword: "faxina", category: "Moradia", subcategory: "Serviços Domésticos", type: "despesa", priority: 90 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2. ALIMENTAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "supermercado", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 80 },
  { keyword: "pão de açúcar", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 100 },
  { keyword: "pao de acucar", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 100 },
  { keyword: "carrefour", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 100 },
  { keyword: "extra hiper", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 100 },
  { keyword: "assai", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 100 },
  { keyword: "atacadão", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 100 },
  { keyword: "atacadao", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 100 },
  { keyword: "dia supermercado", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 100 },
  { keyword: "mercado", category: "Alimentação", subcategory: "Supermercado", type: "despesa", priority: 70 },
  { keyword: "hortifruti", category: "Alimentação", subcategory: "Hortifruti", type: "despesa", priority: 80 },
  { keyword: "feira", category: "Alimentação", subcategory: "Hortifruti", type: "despesa", priority: 70 },
  { keyword: "restaurante", category: "Alimentação", subcategory: "Restaurante", type: "despesa", priority: 90 },
  { keyword: "sushi", category: "Alimentação", subcategory: "Restaurante", type: "despesa", priority: 90 },
  { keyword: "pizzaria", category: "Alimentação", subcategory: "Restaurante", type: "despesa", priority: 90 },
  { keyword: "churrascaria", category: "Alimentação", subcategory: "Restaurante", type: "despesa", priority: 90 },
  { keyword: "lanchonete", category: "Alimentação", subcategory: "Fast Food", type: "despesa", priority: 90 },
  { keyword: "mcdonalds", category: "Alimentação", subcategory: "Fast Food", type: "despesa", priority: 100 },
  { keyword: "mc donalds", category: "Alimentação", subcategory: "Fast Food", type: "despesa", priority: 100 },
  { keyword: "burger king", category: "Alimentação", subcategory: "Fast Food", type: "despesa", priority: 100 },
  { keyword: "subway", category: "Alimentação", subcategory: "Fast Food", type: "despesa", priority: 100 },
  { keyword: "kfc", category: "Alimentação", subcategory: "Fast Food", type: "despesa", priority: 100 },
  { keyword: "popeyes", category: "Alimentação", subcategory: "Fast Food", type: "despesa", priority: 100 },
  { keyword: "ifood", category: "Alimentação", subcategory: "Delivery", type: "despesa", priority: 100 },
  { keyword: "rappi", category: "Alimentação", subcategory: "Delivery", type: "despesa", priority: 100 },
  { keyword: "zé delivery", category: "Alimentação", subcategory: "Delivery", type: "despesa", priority: 100 },
  { keyword: "ze delivery", category: "Alimentação", subcategory: "Delivery", type: "despesa", priority: 100 },
  { keyword: "padaria", category: "Alimentação", subcategory: "Padaria e Café", type: "despesa", priority: 90 },
  { keyword: "starbucks", category: "Alimentação", subcategory: "Padaria e Café", type: "despesa", priority: 100 },
  { keyword: "café", category: "Alimentação", subcategory: "Padaria e Café", type: "despesa", priority: 70 },
  { keyword: "confeitaria", category: "Alimentação", subcategory: "Padaria e Café", type: "despesa", priority: 90 },
  { keyword: "bar ", category: "Alimentação", subcategory: "Bar e Petisco", type: "despesa", priority: 70 },
  { keyword: "petiscos", category: "Alimentação", subcategory: "Bar e Petisco", type: "despesa", priority: 80 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3. TRANSPORTE
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "uber", category: "Transporte", subcategory: "Apps", type: "despesa", priority: 100 },
  { keyword: "99app", category: "Transporte", subcategory: "Apps", type: "despesa", priority: 100 },
  { keyword: "99pop", category: "Transporte", subcategory: "Apps", type: "despesa", priority: 100 },
  { keyword: "indriver", category: "Transporte", subcategory: "Apps", type: "despesa", priority: 100 },
  { keyword: "cabify", category: "Transporte", subcategory: "Apps", type: "despesa", priority: 100 },
  { keyword: "combustível", category: "Transporte", subcategory: "Combustível", type: "despesa", priority: 80 },
  { keyword: "posto", category: "Transporte", subcategory: "Combustível", type: "despesa", priority: 70 },
  { keyword: "shell", category: "Transporte", subcategory: "Combustível", type: "despesa", priority: 90 },
  { keyword: "ipiranga", category: "Transporte", subcategory: "Combustível", type: "despesa", priority: 90 },
  { keyword: "br distribuidora", category: "Transporte", subcategory: "Combustível", type: "despesa", priority: 90 },
  { keyword: "sem parar", category: "Transporte", subcategory: "Estacionamento / Pedágio", type: "despesa", priority: 90 },
  { keyword: "veloe", category: "Transporte", subcategory: "Estacionamento / Pedágio", type: "despesa", priority: 90 },
  { keyword: "connectcar", category: "Transporte", subcategory: "Estacionamento / Pedágio", type: "despesa", priority: 90 },
  { keyword: "autopista", category: "Transporte", subcategory: "Estacionamento / Pedágio", type: "despesa", priority: 80 },
  { keyword: "pedágio", category: "Transporte", subcategory: "Estacionamento / Pedágio", type: "despesa", priority: 80 },
  { keyword: "estacionamento", category: "Transporte", subcategory: "Estacionamento / Pedágio", type: "despesa", priority: 80 },
  { keyword: "estapar", category: "Transporte", subcategory: "Estacionamento / Pedágio", type: "despesa", priority: 90 },
  { keyword: "metrô", category: "Transporte", subcategory: "Transporte Público", type: "despesa", priority: 80 },
  { keyword: "metro sp", category: "Transporte", subcategory: "Transporte Público", type: "despesa", priority: 80 },
  { keyword: "bilhete único", category: "Transporte", subcategory: "Transporte Público", type: "despesa", priority: 80 },
  { keyword: "sptrans", category: "Transporte", subcategory: "Transporte Público", type: "despesa", priority: 80 },
  { keyword: "brt", category: "Transporte", subcategory: "Transporte Público", type: "despesa", priority: 80 },
  { keyword: "latam", category: "Transporte", subcategory: "Passagem Aérea", type: "despesa", priority: 90 },
  { keyword: "gol linhas", category: "Transporte", subcategory: "Passagem Aérea", type: "despesa", priority: 90 },
  { keyword: "azul linhas", category: "Transporte", subcategory: "Passagem Aérea", type: "despesa", priority: 90 },
  { keyword: "avianca", category: "Transporte", subcategory: "Passagem Aérea", type: "despesa", priority: 90 },
  { keyword: "oficina", category: "Transporte", subcategory: "Manutenção do Veículo", type: "despesa", priority: 80 },
  { keyword: "borracharia", category: "Transporte", subcategory: "Manutenção do Veículo", type: "despesa", priority: 90 },
  { keyword: "seguro auto", category: "Transporte", subcategory: "Seguro do Veículo", type: "despesa", priority: 90 },
  { keyword: "porto seguro", category: "Transporte", subcategory: "Seguro do Veículo", type: "despesa", priority: 90 },
  { keyword: "ipva", category: "Transporte", subcategory: "Documentação Veicular", type: "despesa", priority: 100 },
  { keyword: "licenciamento", category: "Transporte", subcategory: "Documentação Veicular", type: "despesa", priority: 90 },
  { keyword: "detran", category: "Transporte", subcategory: "Documentação Veicular", type: "despesa", priority: 90 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4. CONTAS E UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "internet", category: "Contas e Utilidades", subcategory: "Internet Residencial", type: "despesa", priority: 90 },
  { keyword: "vivo fibra", category: "Contas e Utilidades", subcategory: "Internet Residencial", type: "despesa", priority: 100 },
  { keyword: "claro internet", category: "Contas e Utilidades", subcategory: "Internet Residencial", type: "despesa", priority: 100 },
  { keyword: "net virtua", category: "Contas e Utilidades", subcategory: "Internet Residencial", type: "despesa", priority: 100 },
  { keyword: "vivo", category: "Contas e Utilidades", subcategory: "Telefone e Celular", type: "despesa", priority: 90 },
  { keyword: "claro", category: "Contas e Utilidades", subcategory: "Telefone e Celular", type: "despesa", priority: 90 },
  { keyword: "tim", category: "Contas e Utilidades", subcategory: "Telefone e Celular", type: "despesa", priority: 90 },
  { keyword: "oi celular", category: "Contas e Utilidades", subcategory: "Telefone e Celular", type: "despesa", priority: 100 },
  { keyword: "recarga celular", category: "Contas e Utilidades", subcategory: "Telefone e Celular", type: "despesa", priority: 90 },
  { keyword: "sky tv", category: "Contas e Utilidades", subcategory: "TV por Assinatura", type: "despesa", priority: 100 },
  { keyword: "claro tv", category: "Contas e Utilidades", subcategory: "TV por Assinatura", type: "despesa", priority: 100 },
  { keyword: "google one", category: "Contas e Utilidades", subcategory: "Serviços de Nuvem", type: "despesa", priority: 100 },
  { keyword: "icloud", category: "Contas e Utilidades", subcategory: "Serviços de Nuvem", type: "despesa", priority: 100 },
  { keyword: "dropbox", category: "Contas e Utilidades", subcategory: "Serviços de Nuvem", type: "despesa", priority: 100 },
  { keyword: "cesta de serviços", category: "Contas e Utilidades", subcategory: "Serviços Bancários", type: "despesa", priority: 90 },
  { keyword: "anuidade", category: "Contas e Utilidades", subcategory: "Serviços Bancários", type: "despesa", priority: 90 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 5. SAÚDE E BEM-ESTAR (capital E)
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "amil", category: "Saúde e Bem-Estar", subcategory: "Plano de Saúde", type: "despesa", priority: 100 },
  { keyword: "unimed", category: "Saúde e Bem-Estar", subcategory: "Plano de Saúde", type: "despesa", priority: 100 },
  { keyword: "hapvida", category: "Saúde e Bem-Estar", subcategory: "Plano de Saúde", type: "despesa", priority: 100 },
  { keyword: "bradesco saúde", category: "Saúde e Bem-Estar", subcategory: "Plano de Saúde", type: "despesa", priority: 100 },
  { keyword: "sulamerica saúde", category: "Saúde e Bem-Estar", subcategory: "Plano de Saúde", type: "despesa", priority: 100 },
  { keyword: "consulta", category: "Saúde e Bem-Estar", subcategory: "Consulta Médica", type: "despesa", priority: 90 },
  { keyword: "médico", category: "Saúde e Bem-Estar", subcategory: "Consulta Médica", type: "despesa", priority: 90 },
  { keyword: "hospital", category: "Saúde e Bem-Estar", subcategory: "Consulta Médica", type: "despesa", priority: 90 },
  { keyword: "laboratorio", category: "Saúde e Bem-Estar", subcategory: "Consulta Médica", type: "despesa", priority: 90 },
  { keyword: "laboratório", category: "Saúde e Bem-Estar", subcategory: "Consulta Médica", type: "despesa", priority: 90 },
  { keyword: "exame", category: "Saúde e Bem-Estar", subcategory: "Consulta Médica", type: "despesa", priority: 80 },
  { keyword: "dasa", category: "Saúde e Bem-Estar", subcategory: "Consulta Médica", type: "despesa", priority: 100 },
  { keyword: "farmácia", category: "Saúde e Bem-Estar", subcategory: "Farmácia", type: "despesa", priority: 100 },
  { keyword: "farmacia", category: "Saúde e Bem-Estar", subcategory: "Farmácia", type: "despesa", priority: 100 },
  { keyword: "drogaria", category: "Saúde e Bem-Estar", subcategory: "Farmácia", type: "despesa", priority: 100 },
  { keyword: "droga raia", category: "Saúde e Bem-Estar", subcategory: "Farmácia", type: "despesa", priority: 100 },
  { keyword: "ultrafarma", category: "Saúde e Bem-Estar", subcategory: "Farmácia", type: "despesa", priority: 100 },
  { keyword: "drogasil", category: "Saúde e Bem-Estar", subcategory: "Farmácia", type: "despesa", priority: 100 },
  { keyword: "panvel", category: "Saúde e Bem-Estar", subcategory: "Farmácia", type: "despesa", priority: 100 },
  { keyword: "psicólogo", category: "Saúde e Bem-Estar", subcategory: "Terapia / Psicólogo", type: "despesa", priority: 90 },
  { keyword: "psicologo", category: "Saúde e Bem-Estar", subcategory: "Terapia / Psicólogo", type: "despesa", priority: 90 },
  { keyword: "terapia", category: "Saúde e Bem-Estar", subcategory: "Terapia / Psicólogo", type: "despesa", priority: 90 },
  { keyword: "zenklub", category: "Saúde e Bem-Estar", subcategory: "Terapia / Psicólogo", type: "despesa", priority: 100 },
  { keyword: "academia", category: "Saúde e Bem-Estar", subcategory: "Academia", type: "despesa", priority: 90 },
  { keyword: "smartfit", category: "Saúde e Bem-Estar", subcategory: "Academia", type: "despesa", priority: 100 },
  { keyword: "smart fit", category: "Saúde e Bem-Estar", subcategory: "Academia", type: "despesa", priority: 100 },
  { keyword: "bluefit", category: "Saúde e Bem-Estar", subcategory: "Academia", type: "despesa", priority: 100 },
  { keyword: "bodytech", category: "Saúde e Bem-Estar", subcategory: "Academia", type: "despesa", priority: 100 },
  { keyword: "personal trainer", category: "Saúde e Bem-Estar", subcategory: "Academia", type: "despesa", priority: 90 },
  { keyword: "massagem", category: "Saúde e Bem-Estar", subcategory: "Bem-estar", type: "despesa", priority: 80 },
  { keyword: "spa", category: "Saúde e Bem-Estar", subcategory: "Bem-estar", type: "despesa", priority: 80 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 6. EDUCAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "escola", category: "Educação", subcategory: "Mensalidade Escolar / Faculdade", type: "despesa", priority: 90 },
  { keyword: "faculdade", category: "Educação", subcategory: "Mensalidade Escolar / Faculdade", type: "despesa", priority: 90 },
  { keyword: "universidade", category: "Educação", subcategory: "Mensalidade Escolar / Faculdade", type: "despesa", priority: 90 },
  { keyword: "mensalidade", category: "Educação", subcategory: "Mensalidade Escolar / Faculdade", type: "despesa", priority: 80 },
  { keyword: "udemy", category: "Educação", subcategory: "Cursos e Treinamentos", type: "despesa", priority: 100 },
  { keyword: "coursera", category: "Educação", subcategory: "Cursos e Treinamentos", type: "despesa", priority: 100 },
  { keyword: "alura", category: "Educação", subcategory: "Cursos e Treinamentos", type: "despesa", priority: 100 },
  { keyword: "rocketseat", category: "Educação", subcategory: "Cursos e Treinamentos", type: "despesa", priority: 100 },
  { keyword: "origamid", category: "Educação", subcategory: "Cursos e Treinamentos", type: "despesa", priority: 100 },
  { keyword: "domestika", category: "Educação", subcategory: "Cursos e Treinamentos", type: "despesa", priority: 100 },
  { keyword: "livraria", category: "Educação", subcategory: "Livros e Materiais", type: "despesa", priority: 90 },
  { keyword: "amazon kindle", category: "Educação", subcategory: "Livros e Materiais", type: "despesa", priority: 100 },
  { keyword: "saraiva", category: "Educação", subcategory: "Livros e Materiais", type: "despesa", priority: 100 },
  { keyword: "cultura livr", category: "Educação", subcategory: "Livros e Materiais", type: "despesa", priority: 100 },
  { keyword: "papelaria", category: "Educação", subcategory: "Papelaria", type: "despesa", priority: 90 },
  { keyword: "kalunga", category: "Educação", subcategory: "Papelaria", type: "despesa", priority: 100 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 7. TRABALHO E NEGÓCIOS
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "coworking", category: "Trabalho e Negócios", subcategory: "Equipamentos de Trabalho", type: "despesa", priority: 90 },
  { keyword: "wework", category: "Trabalho e Negócios", subcategory: "Equipamentos de Trabalho", type: "despesa", priority: 100 },
  { keyword: "nota fiscal", category: "Trabalho e Negócios", subcategory: "Despesas MEI / PJ", type: "despesa", priority: 80 },
  { keyword: "das mei", category: "Trabalho e Negócios", subcategory: "Despesas MEI / PJ", type: "despesa", priority: 100 },
  { keyword: "contabilidade", category: "Trabalho e Negócios", subcategory: "Despesas MEI / PJ", type: "despesa", priority: 90 },
  { keyword: "contador", category: "Trabalho e Negócios", subcategory: "Despesas MEI / PJ", type: "despesa", priority: 90 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 8. LAZER E ENTRETENIMENTO
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "booking", category: "Lazer e Entretenimento", subcategory: "Viagem", type: "despesa", priority: 90 },
  { keyword: "airbnb", category: "Lazer e Entretenimento", subcategory: "Viagem", type: "despesa", priority: 100 },
  { keyword: "hotel", category: "Lazer e Entretenimento", subcategory: "Viagem", type: "despesa", priority: 80 },
  { keyword: "pousada", category: "Lazer e Entretenimento", subcategory: "Viagem", type: "despesa", priority: 80 },
  { keyword: "hospedagem", category: "Lazer e Entretenimento", subcategory: "Viagem", type: "despesa", priority: 80 },
  { keyword: "decolar", category: "Lazer e Entretenimento", subcategory: "Viagem", type: "despesa", priority: 100 },
  { keyword: "123milhas", category: "Lazer e Entretenimento", subcategory: "Viagem", type: "despesa", priority: 100 },
  { keyword: "balada", category: "Lazer e Entretenimento", subcategory: "Bar e Balada", type: "despesa", priority: 80 },
  { keyword: "boate", category: "Lazer e Entretenimento", subcategory: "Bar e Balada", type: "despesa", priority: 80 },
  { keyword: "cinema", category: "Lazer e Entretenimento", subcategory: "Cinema e Teatro", type: "despesa", priority: 100 },
  { keyword: "cinemark", category: "Lazer e Entretenimento", subcategory: "Cinema e Teatro", type: "despesa", priority: 100 },
  { keyword: "kinoplex", category: "Lazer e Entretenimento", subcategory: "Cinema e Teatro", type: "despesa", priority: 100 },
  { keyword: "ingresso", category: "Lazer e Entretenimento", subcategory: "Cinema e Teatro", type: "despesa", priority: 90 },
  { keyword: "ticketmaster", category: "Lazer e Entretenimento", subcategory: "Cinema e Teatro", type: "despesa", priority: 100 },
  { keyword: "sympla", category: "Lazer e Entretenimento", subcategory: "Cinema e Teatro", type: "despesa", priority: 100 },
  { keyword: "show", category: "Lazer e Entretenimento", subcategory: "Cinema e Teatro", type: "despesa", priority: 80 },
  { keyword: "teatro", category: "Lazer e Entretenimento", subcategory: "Cinema e Teatro", type: "despesa", priority: 90 },
  { keyword: "steam", category: "Lazer e Entretenimento", subcategory: "Jogos e Games", type: "despesa", priority: 100 },
  { keyword: "playstation", category: "Lazer e Entretenimento", subcategory: "Jogos e Games", type: "despesa", priority: 100 },
  { keyword: "xbox", category: "Lazer e Entretenimento", subcategory: "Jogos e Games", type: "despesa", priority: 100 },
  { keyword: "nintendo", category: "Lazer e Entretenimento", subcategory: "Jogos e Games", type: "despesa", priority: 100 },
  { keyword: "jogo", category: "Lazer e Entretenimento", subcategory: "Jogos e Games", type: "despesa", priority: 70 },
  { keyword: "futebol", category: "Lazer e Entretenimento", subcategory: "Esporte", type: "despesa", priority: 80 },
  { keyword: "esporte", category: "Lazer e Entretenimento", subcategory: "Esporte", type: "despesa", priority: 70 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 9. COMPRAS E E-COMMERCE
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "zara", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 100 },
  { keyword: "hm", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 90 },
  { keyword: "renner", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 100 },
  { keyword: "riachuelo", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 100 },
  { keyword: "c&a", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 100 },
  { keyword: "centauro", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 100 },
  { keyword: "adidas", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 100 },
  { keyword: "nike", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 100 },
  { keyword: "netshoes", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 100 },
  { keyword: "shein", category: "Compras e E-commerce", subcategory: "Roupas e Calçados", type: "despesa", priority: 100 },
  { keyword: "o boticário", category: "Compras e E-commerce", subcategory: "Beleza e Cosméticos", type: "despesa", priority: 100 },
  { keyword: "boticario", category: "Compras e E-commerce", subcategory: "Beleza e Cosméticos", type: "despesa", priority: 100 },
  { keyword: "sephora", category: "Compras e E-commerce", subcategory: "Beleza e Cosméticos", type: "despesa", priority: 100 },
  { keyword: "natura", category: "Compras e E-commerce", subcategory: "Beleza e Cosméticos", type: "despesa", priority: 100 },
  { keyword: "salão", category: "Compras e E-commerce", subcategory: "Beleza e Cosméticos", type: "despesa", priority: 80 },
  { keyword: "barbearia", category: "Compras e E-commerce", subcategory: "Beleza e Cosméticos", type: "despesa", priority: 90 },
  { keyword: "kabum", category: "Compras e E-commerce", subcategory: "Eletrônicos", type: "despesa", priority: 100 },
  { keyword: "pichau", category: "Compras e E-commerce", subcategory: "Eletrônicos", type: "despesa", priority: 100 },
  { keyword: "terabyte", category: "Compras e E-commerce", subcategory: "Eletrônicos", type: "despesa", priority: 100 },
  { keyword: "mercado livre", category: "Compras e E-commerce", subcategory: "E-commerce Geral", type: "despesa", priority: 100 },
  { keyword: "mercadolivre", category: "Compras e E-commerce", subcategory: "E-commerce Geral", type: "despesa", priority: 100 },
  { keyword: "amazon", category: "Compras e E-commerce", subcategory: "E-commerce Geral", type: "despesa", priority: 80 },
  { keyword: "shopee", category: "Compras e E-commerce", subcategory: "E-commerce Geral", type: "despesa", priority: 100 },
  { keyword: "aliexpress", category: "Compras e E-commerce", subcategory: "E-commerce Geral", type: "despesa", priority: 100 },
  { keyword: "magalu", category: "Compras e E-commerce", subcategory: "E-commerce Geral", type: "despesa", priority: 100 },
  { keyword: "magazine luiza", category: "Compras e E-commerce", subcategory: "E-commerce Geral", type: "despesa", priority: 100 },
  { keyword: "americanas", category: "Compras e E-commerce", subcategory: "E-commerce Geral", type: "despesa", priority: 100 },
  { keyword: "casas bahia", category: "Compras e E-commerce", subcategory: "E-commerce Geral", type: "despesa", priority: 100 },
  { keyword: "presente", category: "Compras e E-commerce", subcategory: "Presentes", type: "despesa", priority: 70 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 10. FAMÍLIA E DEPENDENTES
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "pensão", category: "Família e Dependentes", subcategory: "Pensão / Manutenção", type: "despesa", priority: 90 },
  { keyword: "pensao", category: "Família e Dependentes", subcategory: "Pensão / Manutenção", type: "despesa", priority: 90 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 11. ASSINATURAS E SERVIÇOS
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "netflix", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 100 },
  { keyword: "spotify", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 100 },
  { keyword: "amazon prime", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 100 },
  { keyword: "disney", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 100 },
  { keyword: "hbo max", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 100 },
  { keyword: "max ", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 80 },
  { keyword: "youtube premium", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 100 },
  { keyword: "apple tv", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 100 },
  { keyword: "deezer", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 100 },
  { keyword: "crunchyroll", category: "Assinaturas e Serviços", subcategory: "Streaming", type: "despesa", priority: 100 },
  { keyword: "github", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "notion", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "figma", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "vercel", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "hostinger", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "chatgpt", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "openai", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "anthropic", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "claude.ai", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "canva", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "slack", category: "Assinaturas e Serviços", subcategory: "SaaS e Ferramentas", type: "despesa", priority: 100 },
  { keyword: "apple", category: "Assinaturas e Serviços", subcategory: "Apps de Produtividade", type: "despesa", priority: 80 },
  { keyword: "game pass", category: "Assinaturas e Serviços", subcategory: "Jogos por Assinatura", type: "despesa", priority: 100 },
  { keyword: "ps plus", category: "Assinaturas e Serviços", subcategory: "Jogos por Assinatura", type: "despesa", priority: 100 },
  { keyword: "ea play", category: "Assinaturas e Serviços", subcategory: "Jogos por Assinatura", type: "despesa", priority: 100 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 12. IMPOSTOS E TAXAS
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "iof", category: "Impostos e Taxas", subcategory: "IOF", type: "despesa", priority: 100 },
  { keyword: "taxa bancária", category: "Impostos e Taxas", subcategory: "Taxa Bancária", type: "despesa", priority: 90 },
  { keyword: "tarifa", category: "Impostos e Taxas", subcategory: "Taxa Bancária", type: "despesa", priority: 80 },
  { keyword: "juros", category: "Impostos e Taxas", subcategory: "Juros e Multas Bancárias", type: "despesa", priority: 80 },
  { keyword: "multa", category: "Impostos e Taxas", subcategory: "Juros e Multas Bancárias", type: "despesa", priority: 80 },
  { keyword: "imposto de renda", category: "Impostos e Taxas", subcategory: "Imposto de Renda", type: "despesa", priority: 100 },
  { keyword: "darf", category: "Impostos e Taxas", subcategory: "Imposto de Renda", type: "despesa", priority: 100 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 13. DÍVIDAS E CRÉDITO
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "empréstimo", category: "Dívidas e Crédito", subcategory: "Empréstimo Pessoal", type: "despesa", priority: 90 },
  { keyword: "emprestimo", category: "Dívidas e Crédito", subcategory: "Empréstimo Pessoal", type: "despesa", priority: 90 },
  { keyword: "consignado", category: "Dívidas e Crédito", subcategory: "Empréstimo Consignado", type: "despesa", priority: 100 },
  { keyword: "financiamento veículo", category: "Dívidas e Crédito", subcategory: "Financiamento de Veículo", type: "despesa", priority: 100 },
  { keyword: "crédito rotativo", category: "Dívidas e Crédito", subcategory: "Outras Dívidas", type: "despesa", priority: 90 },
  { keyword: "cheque especial", category: "Dívidas e Crédito", subcategory: "Outras Dívidas", type: "despesa", priority: 90 },
  { keyword: "crediário", category: "Dívidas e Crédito", subcategory: "Outras Dívidas", type: "despesa", priority: 90 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 14. INVESTIMENTOS E PATRIMÔNIO
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "tesouro direto", category: "Investimentos e Patrimônio", subcategory: "Renda Fixa", type: "despesa", priority: 100 },
  { keyword: "renda fixa", category: "Investimentos e Patrimônio", subcategory: "Renda Fixa", type: "despesa", priority: 100 },
  { keyword: "cdb", category: "Investimentos e Patrimônio", subcategory: "Renda Fixa", type: "despesa", priority: 100 },
  { keyword: "lci", category: "Investimentos e Patrimônio", subcategory: "Renda Fixa", type: "despesa", priority: 100 },
  { keyword: "lca", category: "Investimentos e Patrimônio", subcategory: "Renda Fixa", type: "despesa", priority: 100 },
  { keyword: "ações", category: "Investimentos e Patrimônio", subcategory: "Renda Variável", type: "despesa", priority: 90 },
  { keyword: "fii", category: "Investimentos e Patrimônio", subcategory: "Renda Variável", type: "despesa", priority: 100 },
  { keyword: "etf", category: "Investimentos e Patrimônio", subcategory: "Renda Variável", type: "despesa", priority: 100 },
  { keyword: "b3", category: "Investimentos e Patrimônio", subcategory: "Renda Variável", type: "despesa", priority: 100 },
  { keyword: "criptomoeda", category: "Investimentos e Patrimônio", subcategory: "Criptoativos", type: "despesa", priority: 90 },
  { keyword: "bitcoin", category: "Investimentos e Patrimônio", subcategory: "Criptoativos", type: "despesa", priority: 100 },
  { keyword: "binance", category: "Investimentos e Patrimônio", subcategory: "Criptoativos", type: "despesa", priority: 100 },
  { keyword: "mercado bitcoin", category: "Investimentos e Patrimônio", subcategory: "Criptoativos", type: "despesa", priority: 100 },
  { keyword: "previdência", category: "Investimentos e Patrimônio", subcategory: "Previdência Privada", type: "despesa", priority: 100 },
  { keyword: "previdencia", category: "Investimentos e Patrimônio", subcategory: "Previdência Privada", type: "despesa", priority: 100 },
  { keyword: "investimento", category: "Investimentos e Patrimônio", subcategory: "Outros Investimentos", type: "despesa", priority: 80 },
  { keyword: "nuinvest", category: "Investimentos e Patrimônio", subcategory: "Outros Investimentos", type: "despesa", priority: 100 },
  { keyword: "xp investimentos", category: "Investimentos e Patrimônio", subcategory: "Outros Investimentos", type: "despesa", priority: 100 },
  { keyword: "rico investimentos", category: "Investimentos e Patrimônio", subcategory: "Outros Investimentos", type: "despesa", priority: 100 },
  { keyword: "clear corretora", category: "Investimentos e Patrimônio", subcategory: "Corretagem e Taxas", type: "despesa", priority: 100 },
  { keyword: "corretagem", category: "Investimentos e Patrimônio", subcategory: "Corretagem e Taxas", type: "despesa", priority: 90 },

  // Receitas de investimento
  { keyword: "rendimento", category: "Receita", subcategory: "Receita de Investimentos", type: "receita", priority: 90 },
  { keyword: "dividendo", category: "Receita", subcategory: "Receita de Investimentos", type: "receita", priority: 100 },
  { keyword: "juros recebido", category: "Receita", subcategory: "Receita de Investimentos", type: "receita", priority: 90 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 15. POUPANÇA E RESERVAS
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "reserva de emergência", category: "Poupança e Reservas", subcategory: "Reserva de Emergência", type: "despesa", priority: 100 },
  { keyword: "poupança", category: "Poupança e Reservas", subcategory: "Poupança Curto Prazo", type: "despesa", priority: 80 },
  { keyword: "cofrinho", category: "Poupança e Reservas", subcategory: "Cofrinhos / Caixinhas", type: "despesa", priority: 90 },
  { keyword: "caixinha", category: "Poupança e Reservas", subcategory: "Cofrinhos / Caixinhas", type: "despesa", priority: 90 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 16. TRANSFERÊNCIAS PESSOAIS
  // ═══════════════════════════════════════════════════════════════════════════════
  // (These are typically inferred by the AI/n8n based on context, not keywords)

  // ═══════════════════════════════════════════════════════════════════════════════
  // 17. RECEITA
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "salário", category: "Receita", subcategory: "Salário e Repasse", type: "receita", priority: 100 },
  { keyword: "salario", category: "Receita", subcategory: "Salário e Repasse", type: "receita", priority: 100 },
  { keyword: "pro-labore", category: "Receita", subcategory: "Salário e Repasse", type: "receita", priority: 100 },
  { keyword: "elytra", category: "Receita", subcategory: "Freelance", type: "receita", priority: 100 },
  { keyword: "freelance", category: "Receita", subcategory: "Freelance", type: "receita", priority: 90 },
  { keyword: "pagamento recebido", category: "Receita", subcategory: "Freelance", type: "receita", priority: 80 },
  { keyword: "bônus", category: "Receita", subcategory: "Bônus / Comissões / PLR", type: "receita", priority: 90 },
  { keyword: "plr", category: "Receita", subcategory: "Bônus / Comissões / PLR", type: "receita", priority: 100 },
  { keyword: "comissão", category: "Receita", subcategory: "Bônus / Comissões / PLR", type: "receita", priority: 90 },
  { keyword: "transferência recebida", category: "Receita", subcategory: "Família", type: "receita", priority: 70 },
  { keyword: "pix recebido", category: "Receita", subcategory: "Família", type: "receita", priority: 70 },
  { keyword: "ted recebido", category: "Receita", subcategory: "Família", type: "receita", priority: 70 },
  { keyword: "estorno", category: "Receita", subcategory: "Estorno", type: "receita", priority: 90 },
  { keyword: "reembolso", category: "Receita", subcategory: "Estorno", type: "receita", priority: 90 },
  { keyword: "chargeback", category: "Receita", subcategory: "Estorno", type: "receita", priority: 100 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 18. CARTÃO DE CRÉDITO
  // ═══════════════════════════════════════════════════════════════════════════════
  // (Pagamento de fatura é filtrado no parser, mas caso passe:)
  { keyword: "pagamento de fatura", category: "Cartão de Crédito", subcategory: "Pagamento de Fatura", type: "despesa", priority: 100 },
  { keyword: "pagamento fatura", category: "Cartão de Crédito", subcategory: "Pagamento de Fatura", type: "despesa", priority: 100 },

  // ═══════════════════════════════════════════════════════════════════════════════
  // 19. OUTROS
  // ═══════════════════════════════════════════════════════════════════════════════
  { keyword: "doação", category: "Outros", subcategory: "Doações e Caridade", type: "despesa", priority: 80 },
  { keyword: "doacao", category: "Outros", subcategory: "Doações e Caridade", type: "despesa", priority: 80 },
  { keyword: "caridade", category: "Outros", subcategory: "Doações e Caridade", type: "despesa", priority: 80 },
  { keyword: "ong", category: "Outros", subcategory: "Doações e Caridade", type: "despesa", priority: 80 },
];

async function main() {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // Check if subcategory column exists (may not if db:push couldn't run as postgres superuser)
    const colCheck = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'category_rules' AND column_name = 'subcategory'"
    );
    const hasSubcategory = colCheck.rows.length > 0;

    if (!hasSubcategory) {
      console.warn("⚠  Coluna subcategory não existe em category_rules.");
      console.warn("   Execute no VPS como postgres: ALTER TABLE category_rules ADD COLUMN subcategory TEXT;");
      console.warn("   Depois re-execute npm run db:seed para inserir subcategorias.\n");
    }

    console.log(`Inserindo ${rules.length} regras de categorização...`);
    await client.query("DELETE FROM category_rules");

    // Batch insert in chunks of 50 to avoid query size limits
    const chunkSize = 50;
    for (let i = 0; i < rules.length; i += chunkSize) {
      const chunk = rules.slice(i, i + chunkSize);
      if (hasSubcategory) {
        const placeholders = chunk.map((_, j) => `($${j * 5 + 1}, $${j * 5 + 2}, $${j * 5 + 3}, $${j * 5 + 4}, $${j * 5 + 5})`).join(", ");
        const values = chunk.flatMap(r => [r.keyword, r.category, r.subcategory, r.type, r.priority]);
        await client.query(
          `INSERT INTO category_rules (keyword, category, subcategory, type, priority) VALUES ${placeholders}`,
          values
        );
      } else {
        const placeholders = chunk.map((_, j) => `($${j * 4 + 1}, $${j * 4 + 2}, $${j * 4 + 3}, $${j * 4 + 4})`).join(", ");
        const values = chunk.flatMap(r => [r.keyword, r.category, r.type, r.priority]);
        await client.query(
          `INSERT INTO category_rules (keyword, category, type, priority) VALUES ${placeholders}`,
          values
        );
      }
    }

    console.log(`Seed concluído: ${rules.length} regras inseridas${hasSubcategory ? " (com subcategorias)" : " (sem subcategorias)"}.`);
  } finally {
    client.release();
    await pool.end();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
