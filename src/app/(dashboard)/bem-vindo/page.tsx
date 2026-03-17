"use client";

import {
    MessageSquare,
    LayoutDashboard,
    List,
    Tags,
    PieChart,
    Target,
    Bell,
    Upload,
    Zap,
    ArrowRight,
    Brain,
    FileText,
    TrendingUp,
    Shield,
    ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// ─── Feature data ──────────────────────────────────────────────────────────────

const features = [
    {
        icon: MessageSquare,
        title: "Copiloto IA",
        href: "/copiloto",
        tagline: "Pergunte qualquer coisa sobre seu dinheiro",
        tips: [
            '"Quanto gastei com alimentação esse mês?"',
            '"Estou poupando mais do que no mês passado?"',
            '"Cria um gráfico dos meus gastos por categoria"',
            '"Onde posso economizar para bater minha meta?"',
        ],
        howTo: "Digite qualquer pergunta no chat. A IA consulta seus dados em tempo real e responde com análises, gráficos e recomendações personalizadas.",
    },
    {
        icon: Upload,
        title: "Importar Extrato",
        href: "/importar",
        tagline: "Upload do CSV → categorizado em segundos",
        tips: [
            "Nubank, C6, Inter, Santander, Bradesco, Itaú e mais",
            "Duplicatas detectadas automaticamente",
            "A IA categoriza tudo sem você precisar fazer nada",
            "Após importar, o Copiloto já analisa os novos dados",
        ],
        howTo: 'No seu banco: vá em "Extrato" → "Exportar CSV". Arraste o arquivo para a área de upload ou clique para selecionar. Aguarde o processamento.',
    },
    {
        icon: LayoutDashboard,
        title: "Dashboard",
        href: "/dashboard",
        tagline: "Panorama completo das suas finanças",
        tips: [
            "Saldo líquido do mês (receitas − despesas)",
            "Top 5 categorias de gasto",
            "Tendência mensal dos últimos meses",
            "Comparação receita × despesa",
        ],
        howTo: "Acesse a qualquer momento para o panorama completo. Os dados atualizam automaticamente a cada importação.",
    },
    {
        icon: List,
        title: "Transações",
        href: "/transacoes",
        tagline: "Histórico completo e editável",
        tips: [
            "Filtre por mês, categoria ou banco",
            "Edite a categoria com um clique",
            "Busque por nome do estabelecimento",
            "Veja o que foi categorizado pela IA",
        ],
        howTo: "Use os filtros no topo para encontrar o que procura. Clique em uma transação para editar a categoria se a IA errou.",
    },
    {
        icon: PieChart,
        title: "Orçamentos",
        href: "/orcamentos",
        tagline: "Limites que evitam surpresas no fim do mês",
        tips: [
            'Defina limites por categoria (ex: R$500 em Alimentação)',
            "Acompanhe o progresso em tempo real",
            "Alerta automático ao atingir 80% do limite",
            "Veja quais categorias estourou nos últimos meses",
        ],
        howTo: "Clique em '+ Novo orçamento', escolha a categoria e o valor limite. O sistema atualiza automaticamente com novas transações.",
    },
    {
        icon: Target,
        title: "Metas",
        href: "/metas",
        tagline: "Do sonho à realidade, passo a passo",
        tips: [
            "Defina valor alvo e prazo para cada meta",
            "Atualize o valor atual conforme você poupa",
            "Peça ao Copiloto para calcular quanto poupar por mês",
            "Marque metas como concluídas ao bater o objetivo",
        ],
        howTo: "Clique em '+ Nova meta', defina o nome, o valor alvo e um prazo. Atualize mensalmente para acompanhar o progresso.",
    },
    {
        icon: Tags,
        title: "Categorias",
        href: "/categorias",
        tagline: "Organize do seu jeito, a IA aprende",
        tips: [
            "Crie categorias que fazem sentido para você",
            'Adicione exemplos para ensinar a IA (ex: "RU UNICAMP")',
            "Defina cores e ícones para cada categoria",
            "A IA melhora com cada correção que você faz",
        ],
        howTo: "Clique em '+ Nova categoria', nomeie, escolha um ícone e opcionalmente adicione exemplos de transações que pertencem a ela.",
    },
    {
        icon: Bell,
        title: "Alertas",
        href: "/alertas",
        tagline: "Notificações automáticas dos orçamentos",
        tips: [
            "80% do limite: ainda dá tempo de ajustar",
            "100%: orçamento estourado, hora de rever",
            "Dispense alertas resolvidos com um clique",
            "O Copiloto menciona alertas ativos automaticamente",
        ],
        howTo: "Alertas aparecem automaticamente após cada importação. Veja todos na tela de Alertas ou no ícone de sino na sidebar.",
    },
    {
        icon: Zap,
        title: "Automações",
        href: "/automacoes",
        tagline: "Os bastidores do app (avançado)",
        tips: [
            "Veja o status das automações ativas",
            "Monitore se o pipeline de importação está ok",
            "Logs de processamento para usuários técnicos",
        ],
        howTo: "Você não precisa mexer aqui no dia a dia — tudo roda automaticamente. Mas se quiser explorar os bastidores, fique à vontade.",
    },
];

const getStartedSteps = [
    {
        step: "01",
        title: "Importe seu extrato",
        body: "Vá em Importar, baixe o CSV do seu banco e faça o upload. A IA processa e categoriza tudo em segundos.",
        href: "/importar",
        cta: "Ir para Importar",
    },
    {
        step: "02",
        title: "Revise as categorias",
        body: "Em Transações, corrija qualquer categoria que a IA errou. Ela aprende com suas correções.",
        href: "/transacoes",
        cta: "Ver Transações",
    },
    {
        step: "03",
        title: "Configure orçamentos",
        body: "Crie limites mensais para suas categorias principais — isso ativa os alertas automáticos.",
        href: "/orcamentos",
        cta: "Criar Orçamentos",
    },
    {
        step: "04",
        title: "Crie suas metas",
        body: "Registre o que você está guardando dinheiro. O Copiloto calcula quanto poupar por mês.",
        href: "/metas",
        cta: "Definir Metas",
    },
    {
        step: "05",
        title: "Converse com o Copiloto",
        body: "Pergunte qualquer coisa sobre suas finanças. Quanto mais usa, mais ele te ajuda.",
        href: "/copiloto",
        cta: "Abrir Copiloto",
    },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BemVindoPage() {
    const [openFeature, setOpenFeature] = useState<string | null>("Copiloto IA");

    return (
        <div
            className="max-w-[640px] mx-auto px-4 py-8 pb-24"
            style={{ color: "var(--text-primary)" }}
        >
            {/* ── Beta badge ──────────────────────────────────────────────── */}
            <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium mb-6"
                style={{
                    background: "rgba(234,179,8,0.1)",
                    color: "#eab308",
                    border: "1px solid rgba(234,179,8,0.2)",
                }}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                Beta fechada — Família &amp; Amigos
            </span>

            {/* ── Carta do Leo ─────────────────────────────────────────────── */}
            <section className="mb-12">
                {/* Photo + identity */}
                <div className="flex items-center gap-4 mb-5">
                    <img
                        src="/images/leo-portrait.jpeg"
                        alt="Leonardo Ramos"
                        className="rounded-full object-cover shrink-0"
                        style={{ border: "2px solid var(--border)", width: 56, height: 56 }}
                    />
                    <div>
                        <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
                            Leonardo Ramos
                        </p>
                        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                            Criador do Finance Friend · Elytra AI
                        </p>
                    </div>
                </div>

                <h1 className="text-h1 mb-4" style={{ lineHeight: "1.15" }}>
                    Bem-vindo ao<br />Finance Friend.
                </h1>

                <div className="space-y-4 text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <p>
                        Oi gente! Que bom ter você aqui. Esse projeto nasceu de uma dor real: todo mês eu perdia{" "}
                        <strong style={{ color: "var(--text-primary)" }}>3 horas</strong>{" "}
                        categorizando gastos manualmente. Chato demais — e nunca tinha uma visão clara dos meus padrões.
                    </p>
                    <p>
                        Pensei: <em style={{ color: "var(--text-primary)" }}>se eu sei fazer IA e automações, por que não resolver isso de vez?</em>{" "}
                        Nasceu o Finance Friend. Importa seus extratos, categoriza tudo com IA e tem um copiloto que responde qualquer pergunta sobre seu dinheiro.
                    </p>
                    <p>
                        Vocês são os{" "}
                        <strong style={{ color: "var(--text-primary)" }}>primeiros usuários</strong>.
                        Usem sem moderação, tentem quebrar, e me contem tudo o que acham. Seus dados ficam no meu servidor privado e nunca são compartilhados.
                    </p>
                </div>

                {/* Desk photo */}
                <div
                    className="relative mt-6 rounded-[10px] overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}
                >
                    <img
                        src="/images/leo-desk.jpeg"
                        alt="Leo no setup mostrando o Finance Friend"
                        className="w-full object-cover object-top"
                        style={{ maxHeight: "240px", display: "block" }}
                    />
                    <div
                        className="absolute bottom-0 left-0 right-0 h-12"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}
                    />
                    <p
                        className="absolute bottom-3 left-4 text-[11px]"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                        O dashboard no meu monitor 👆
                    </p>
                </div>
            </section>

            <div className="w-full h-px mb-12" style={{ background: "var(--border)" }} />

            {/* ── O que é o Finance Friend ────────────────────────────────── */}
            <section className="mb-12">
                <h2 className="text-h2 mb-1">O que é o Finance Friend?</h2>
                <p className="text-body mb-6" style={{ color: "var(--text-muted)" }}>
                    Três pilares que tornam a gestão financeira simples de verdade.
                </p>
                <div className="flex flex-col gap-3">
                    {[
                        {
                            icon: Brain,
                            title: "IA que te entende",
                            body: "Responde perguntas, cria gráficos e sugere melhorias sobre suas finanças em linguagem natural.",
                        },
                        {
                            icon: FileText,
                            title: "Zero redigitação",
                            body: "Upload do CSV do banco → a IA processa, categoriza e insere tudo. Suporte a 10+ bancos brasileiros.",
                        },
                        {
                            icon: TrendingUp,
                            title: "Visão dos seus padrões",
                            body: "Dashboards, orçamentos e metas que mostram onde seu dinheiro vai e te ajudam mês a mês.",
                        },
                    ].map((card) => (
                        <div
                            key={card.title}
                            className="flex items-start gap-4 rounded-[8px] border p-4"
                            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                        >
                            <div
                                className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                            >
                                <card.icon size={17} style={{ color: "var(--text-primary)" }} />
                            </div>
                            <div>
                                <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
                                    {card.title}
                                </p>
                                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    {card.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="w-full h-px mb-12" style={{ background: "var(--border)" }} />

            {/* ── Por onde começar ────────────────────────────────────────── */}
            <section className="mb-12">
                <h2 className="text-h2 mb-1">Por onde começar?</h2>
                <p className="text-body mb-6" style={{ color: "var(--text-muted)" }}>
                    O fluxo recomendado — do zero ao primeiro insight.
                </p>
                <div className="relative">
                    {/* Vertical line */}
                    <div
                        className="absolute left-[19px] top-6 bottom-6 w-px"
                        style={{ background: "var(--border)" }}
                    />
                    <div className="flex flex-col gap-4">
                        {getStartedSteps.map((s) => (
                            <div key={s.step} className="flex gap-4">
                                <div
                                    className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold z-10"
                                    style={{
                                        background: "var(--bg-base)",
                                        border: "1px solid var(--border)",
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    {s.step}
                                </div>
                                <div className="flex-1 pb-1">
                                    <p className="text-[14px] font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
                                        {s.title}
                                    </p>
                                    <p className="text-[13px] mb-3" style={{ color: "var(--text-muted)" }}>
                                        {s.body}
                                    </p>
                                    <Link
                                        href={s.href}
                                        className="inline-flex items-center gap-1.5 text-[12px] transition-opacity hover:opacity-70"
                                        style={{ color: "var(--accent-green)", fontWeight: 500 }}
                                    >
                                        {s.cta} <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="w-full h-px mb-12" style={{ background: "var(--border)" }} />

            {/* ── Tutorial de funcionalidades (accordion) ─────────────────── */}
            <section className="mb-12">
                <h2 className="text-h2 mb-1">Guia de funcionalidades</h2>
                <p className="text-body mb-6" style={{ color: "var(--text-muted)" }}>
                    Tudo que você pode fazer no app, seção por seção.
                </p>
                <div
                    className="rounded-[10px] border overflow-hidden"
                    style={{ borderColor: "var(--border)" }}
                >
                    {features.map((feat, idx) => {
                        const isOpen = openFeature === feat.title;
                        return (
                            <div
                                key={feat.title}
                                style={{
                                    borderBottom: idx < features.length - 1 ? "1px solid var(--border)" : "none",
                                }}
                            >
                                {/* Accordion header */}
                                <button
                                    className="w-full flex items-center justify-between px-4 py-4 text-left transition-colors"
                                    style={{
                                        background: isOpen ? "var(--bg-elevated)" : "var(--bg-surface)",
                                    }}
                                    onClick={() => setOpenFeature(isOpen ? null : feat.title)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0"
                                            style={{
                                                background: isOpen ? "var(--bg-base)" : "var(--bg-elevated)",
                                                border: "1px solid var(--border)",
                                            }}
                                        >
                                            <feat.icon size={15} style={{ color: "var(--text-primary)" }} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                                                {feat.title}
                                            </p>
                                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                                {feat.tagline}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        style={{
                                            color: "var(--text-muted)",
                                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                            flexShrink: 0,
                                        }}
                                    />
                                </button>

                                {/* Accordion body */}
                                {isOpen && (
                                    <div
                                        className="px-4 pb-5 pt-1"
                                        style={{ background: "var(--bg-elevated)" }}
                                    >
                                        {/* How to */}
                                        <div
                                            className="rounded-[6px] px-3 py-3 mb-4 text-[12px] leading-relaxed"
                                            style={{
                                                background: "var(--bg-base)",
                                                border: "1px solid var(--border)",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            {feat.howTo}
                                        </div>

                                        {/* Tips */}
                                        <ul className="space-y-2 mb-4">
                                            {feat.tips.map((tip) => (
                                                <li
                                                    key={tip}
                                                    className="flex items-start gap-2 text-[12px]"
                                                    style={{ color: "var(--text-secondary)" }}
                                                >
                                                    <span
                                                        className="mt-[5px] w-1 h-1 rounded-full shrink-0"
                                                        style={{ background: "var(--accent-green)" }}
                                                    />
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>

                                        <Link
                                            href={feat.href}
                                            className="inline-flex items-center gap-1.5 text-[12px] transition-opacity hover:opacity-70"
                                            style={{ color: "var(--accent-green)", fontWeight: 500 }}
                                        >
                                            Abrir {feat.title} <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="w-full h-px mb-12" style={{ background: "var(--border)" }} />

            {/* ── Bancos suportados ───────────────────────────────────────── */}
            <section className="mb-12">
                <h2 className="text-h2 mb-1">Bancos suportados</h2>
                <p className="text-body mb-5" style={{ color: "var(--text-muted)" }}>
                    O importador detecta o formato automaticamente — sem configuração.
                </p>
                <div className="flex flex-wrap gap-2">
                    {[
                        "Nubank Crédito", "Nubank Conta", "C6 Crédito", "C6 Conta",
                        "Inter Crédito", "Inter Conta", "Santander Crédito", "Santander Conta",
                        "Bradesco Crédito", "Bradesco Conta", "Itaú Conta", "BB Crédito",
                        "BB Conta", "Caixa Conta", "BTG Crédito", "BTG Conta", "XP Crédito",
                    ].map((bank) => (
                        <span
                            key={bank}
                            className="px-3 py-1.5 rounded-[6px] border text-[12px]"
                            style={{
                                background: "var(--bg-surface)",
                                borderColor: "var(--border)",
                                color: "var(--text-secondary)",
                            }}
                        >
                            {bank}
                        </span>
                    ))}
                </div>
            </section>

            <div className="w-full h-px mb-12" style={{ background: "var(--border)" }} />

            {/* ── Feedback CTA ────────────────────────────────────────────── */}
            <section>
                <div className="flex items-center gap-4 mb-5">
                    <img
                        src="/images/leo-portrait.jpeg"
                        alt="Leonardo Ramos"
                        className="rounded-full object-cover shrink-0"
                        style={{ border: "2px solid var(--border)", width: 48, height: 48 }}
                    />
                    <div>
                        <h2 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            Seu feedback é essencial
                        </h2>
                        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                            Cada mensagem vai direto pra mim
                        </p>
                    </div>
                </div>

                <p
                    className="text-[14px] leading-relaxed mb-6"
                    style={{ color: "var(--text-secondary)" }}
                >
                    Encontrou um bug? Algo não ficou claro? Tem uma ideia? Me conta — qualquer feedback faz o Finance Friend melhorar.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <a
                        href="https://wa.me/5511955511976"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-[8px] text-[13px] font-medium transition-opacity hover:opacity-90 flex-1"
                        style={{ background: "#25d366", color: "#fff" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Mandar WhatsApp
                    </a>
                    <a
                        href="mailto:leonardo@elytraai.com.br"
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-[8px] border text-[13px] font-medium transition-colors hover:opacity-80 flex-1"
                        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        E-mail
                    </a>
                </div>

                {/* Beta notice */}
                <div
                    className="rounded-[8px] border p-4 flex items-start gap-3"
                    style={{ background: "rgba(234,179,8,0.04)", borderColor: "rgba(234,179,8,0.2)" }}
                >
                    <Shield size={16} className="shrink-0 mt-0.5" style={{ color: "#eab308" }} />
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        <strong style={{ color: "#eab308" }}>Beta fechada.</strong>{" "}
                        Podem haver bugs e mudanças frequentes. Seus dados ficam no meu servidor privado e nunca são compartilhados.
                    </p>
                </div>

                {/* Final CTA */}
                <Link
                    href="/copiloto"
                    className="flex items-center justify-center gap-2 w-full py-[14px] rounded-[8px] text-[15px] font-medium transition-opacity hover:opacity-90 mt-6"
                    style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
                >
                    Começar a explorar <ArrowRight size={16} />
                </Link>
            </section>
        </div>
    );
}
