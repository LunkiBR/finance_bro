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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ─── Feature data ─────────────────────────────────────────────────────────────

const features = [
    {
        icon: MessageSquare,
        title: "Copiloto IA",
        href: "/copiloto",
        tagline: "Sua IA financeira pessoal",
        description:
            "O coração do app. Uma inteligência artificial que conhece cada centavo que você gasta e pode responder qualquer pergunta sobre suas finanças em linguagem natural.",
        tips: [
            "\"Quanto gastei com alimentação esse mês?\"",
            "\"Estou conseguindo poupar mais do que no mês passado?\"",
            "\"Cria um gráfico dos meus gastos por categoria\"",
            "\"Onde posso economizar para bater minha meta?\"",
        ],
        howTo: "Digite qualquer pergunta na caixa de chat. A IA consulta seus dados em tempo real e responde com análises, gráficos e recomendações.",
    },
    {
        icon: LayoutDashboard,
        title: "Dashboard",
        href: "/dashboard",
        tagline: "Visão geral do seu dinheiro",
        description:
            "Uma tela com os números mais importantes: saldo do mês, maiores gastos, tendência histórica e distribuição por categoria.",
        tips: [
            "Veja o saldo líquido (receitas − despesas) do mês atual",
            "Identifique suas top 5 categorias de gasto",
            "Acompanhe a tendência mensal dos últimos meses",
            "Compare receita vs despesa ao longo do tempo",
        ],
        howTo: "Acesse a qualquer momento para ter o panorama completo. Os dados são atualizados automaticamente a cada importação.",
    },
    {
        icon: List,
        title: "Transações",
        href: "/transacoes",
        tagline: "Histórico detalhado e editável",
        description:
            "Todas as suas transações em um lugar, com filtros poderosos por período, categoria, banco, tipo (receita/despesa) e busca por descrição.",
        tips: [
            "Filtre por mês, categoria ou banco específico",
            "Edite a categoria de qualquer transação com um clique",
            "Busque por nome do estabelecimento",
            "Veja quais transações foram categorizadas pela IA",
        ],
        howTo: "Use os filtros no topo da tela para encontrar exatamente o que procura. Clique em uma transação para editar a categoria se a IA errou.",
    },
    {
        icon: Tags,
        title: "Categorias",
        href: "/categorias",
        tagline: "Organize do seu jeito",
        description:
            "Crie categorias e subcategorias completamente personalizadas. Você pode dar contexto para a IA para ela categorizar automaticamente seus gastos futuros com mais precisão.",
        tips: [
            "Crie categorias que fazem sentido para sua vida",
            "Adicione exemplos para ensinar a IA (ex: 'RU UNICAMP')",
            "Defina cores e ícones para cada categoria",
            "A IA aprende com suas correções ao longo do tempo",
        ],
        howTo: "Clique em '+ Nova categoria', nomeie, escolha um ícone, e opcionalmente adicione exemplos de transações que pertencem a ela.",
    },
    {
        icon: PieChart,
        title: "Orçamentos",
        href: "/orcamentos",
        tagline: "Controle antes de gastar",
        description:
            "Defina um limite de gastos por categoria a cada mês. Receba alertas automáticos quando estiver chegando perto ou ultrapassando o orçamento.",
        tips: [
            "Defina limites mensais por categoria (ex: R$500 em Alimentação)",
            "Acompanhe o progresso em tempo real",
            "Receba alerta quando atingir 80% do limite",
            "Veja quais categorias estourou nos últimos meses",
        ],
        howTo: "Clique em '+ Novo orçamento', escolha a categoria e o valor limite. O sistema atualiza automaticamente conforme novas transações chegam.",
    },
    {
        icon: Target,
        title: "Metas",
        href: "/metas",
        tagline: "Do sonho à conquista",
        description:
            "Crie metas financeiras — viagem, reserva de emergência, computador novo — e acompanhe seu progresso mês a mês.",
        tips: [
            "Defina um valor alvo e prazo para cada meta",
            "Atualize o valor atual conforme você poupa",
            "Peça ao Copiloto para calcular quanto poupar por mês",
            "Marque metas como concluídas quando bater o objetivo",
        ],
        howTo: "Clique em '+ Nova meta', defina o nome, o valor alvo e opcionalmente um prazo. Atualize o valor atual mensalmente para acompanhar o progresso.",
    },
    {
        icon: Bell,
        title: "Alertas",
        href: "/alertas",
        tagline: "Notificações inteligentes",
        description:
            "O sistema gera alertas automáticos quando um orçamento está próximo do limite ou foi estourado, para você nunca ser pego de surpresa.",
        tips: [
            "Alerta a 80%: ainda dá tempo de ajustar os gastos",
            "Alerta a 100%: orçamento estourado, hora de rever",
            "Dispensa alertas resolvidos com um clique",
            "O Copiloto menciona automaticamente alertas ativos",
        ],
        howTo: "Os alertas aparecem automaticamente após cada importação. Veja todos na tela de Alertas ou no ícone de sino na sidebar.",
    },
    {
        icon: Upload,
        title: "Importar",
        href: "/importar",
        tagline: "Upload em segundos",
        description:
            "Faça upload do extrato CSV do seu banco. A IA processa, categoriza e deduplicata tudo automaticamente. Sem redigitação, sem erro humano.",
        tips: [
            "Nubank (crédito e conta), C6, Inter, Santander, Bradesco",
            "Itaú, Banco do Brasil, Caixa, BTG e XP",
            "Re-importe sem medo: duplicatas são detectadas automaticamente",
            "Após importar, o Copiloto já consegue analisar os novos dados",
        ],
        howTo: "No seu banco, vá em 'Extrato' → 'Exportar CSV'. Arraste o arquivo para a área de upload ou clique para selecionar. Aguarde o processamento.",
    },
    {
        icon: Zap,
        title: "Automações",
        href: "/automacoes",
        tagline: "Bastidores do app",
        description:
            "Gerencie os pipelines n8n que processam seus extratos: categorização por IA, mapeamento de favorecidos, alertas de orçamento e muito mais.",
        tips: [
            "Veja o status das automações ativas",
            "Monitore se o pipeline de importação está funcionando",
            "Para usuários avançados: acesse logs de processamento",
        ],
        howTo: "Esta seção é mais técnica. Você não precisa mexer aqui no dia a dia — tudo roda automaticamente. Mas se quiser explorar, fique à vontade.",
    },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BemVindoPage() {
    return (
        <div
            className="max-w-[800px] mx-auto px-4 py-8 pb-20"
            style={{ color: "var(--text-primary)" }}
        >
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="mb-3">
                <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium mb-4"
                    style={{ background: "rgba(234,179,8,0.12)", color: "#eab308", border: "1px solid rgba(234,179,8,0.2)" }}
                >
                    Beta fechada — Família & Amigos
                </span>
                <h1 className="text-[32px] font-semibold leading-tight mb-2">
                    Bem-vindo ao Finance Friend
                </h1>
                <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>
                    Um guia completo do que você pode fazer aqui.
                </p>
            </div>

            <div
                className="w-full h-px my-8"
                style={{ background: "var(--border)" }}
            />

            {/* ── Carta do Leo ────────────────────────────────────────── */}
            <section className="mb-10">
                <div
                    className="rounded-[10px] border overflow-hidden"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                    {/* Header da carta com foto */}
                    <div
                        className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6"
                        style={{ borderBottom: "1px solid var(--border)" }}
                    >
                        <div className="shrink-0">
                            <Image
                                src="/images/leo-portrait.jpeg"
                                alt="Leonardo Ramos"
                                width={96}
                                height={96}
                                className="rounded-full object-cover"
                                style={{ border: "2px solid var(--border)" }}
                            />
                        </div>
                        <div>
                            <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
                                Leonardo Ramos
                            </p>
                            <p className="text-[12px] mb-3" style={{ color: "var(--text-muted)" }}>
                                Criador do Finance Friend · Elytra AI
                            </p>
                            <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                Oi! Que bom ter você aqui. Isso que você está vendo é um projeto que nasceu de uma dor real — e que agora estou compartilhando com as pessoas que mais importam pra mim.
                            </p>
                        </div>
                    </div>

                    {/* Corpo da carta */}
                    <div className="p-6 space-y-4 text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        <p>
                            Sou apaixonado por inteligência artificial e criação de softwares. Todo mês eu perdia pelo menos <strong style={{ color: "var(--text-primary)" }}>3 horas</strong> categorizando meus gastos manualmente — no HomeBudget, em planilhas, em qualquer plataforma que tentasse usar. Era um atrito enorme, chato demais, e no fim eu nunca tinha uma visão realmente clara dos meus padrões financeiros.
                        </p>
                        <p>
                            Aí pensei: <em style={{ color: "var(--text-primary)" }}>se eu sei fazer automações e IA, por que não resolver esse problema de vez?</em> Nasceu o Finance Friend — uma ferramenta que importa seus extratos bancários automaticamente, categoriza tudo com IA e ainda tem um copiloto que você pode perguntar qualquer coisa sobre o seu dinheiro.
                        </p>
                        <p>
                            Essa é a <strong style={{ color: "var(--text-primary)" }}>beta fechada</strong>, disponível apenas para família e amigos próximos. Vocês são os primeiros a usar, e o feedback de vocês vai moldar o que esse produto vai se tornar. Usem sem moderação, tentem quebrar, e me contem tudo o que acham.
                        </p>
                    </div>

                    {/* Foto no desk */}
                    <div className="relative w-full overflow-hidden" style={{ maxHeight: "320px" }}>
                        <Image
                            src="/images/leo-desk.jpeg"
                            alt="Leo no setup mostrando o Finance Friend"
                            width={800}
                            height={320}
                            className="w-full object-cover object-top"
                            style={{ maxHeight: "320px" }}
                        />
                        <div
                            className="absolute bottom-0 left-0 right-0 h-16"
                            style={{
                                background: "linear-gradient(to top, var(--bg-surface), transparent)",
                            }}
                        />
                        <div
                            className="absolute bottom-3 left-4 text-[12px]"
                            style={{ color: "var(--text-muted)" }}
                        >
                            O dashboard do Finance Friend no meu monitor 👆
                        </div>
                    </div>
                </div>
            </section>

            {/* ── O que é o Finance Friend ─────────────────────────────── */}
            <section className="mb-10">
                <h2 className="text-[20px] font-semibold mb-1">O que é o Finance Friend?</h2>
                <p className="text-[13px] mb-6" style={{ color: "var(--text-muted)" }}>
                    Três pilares que tornam a gestão financeira simples de verdade.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        {
                            icon: Brain,
                            title: "IA que entende você",
                            body: "Uma inteligência artificial treinada nos seus dados que responde perguntas, cria gráficos e sugere melhorias em linguagem natural.",
                        },
                        {
                            icon: FileText,
                            title: "Zero redigitação",
                            body: "Faça upload do CSV do banco e a IA processa, categoriza e insere tudo automaticamente. Suporte para 10+ bancos brasileiros.",
                        },
                        {
                            icon: TrendingUp,
                            title: "Visão dos seus padrões",
                            body: "Dashboards, orçamentos e metas que mostram onde seu dinheiro vai e te ajudam a tomar decisões melhores mês a mês.",
                        },
                    ].map((card) => (
                        <div
                            key={card.title}
                            className="rounded-[8px] border p-4"
                            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                        >
                            <card.icon size={20} className="mb-3" style={{ color: "var(--text-primary)" }} />
                            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                                {card.title}
                            </p>
                            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                {card.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Tutorial de funcionalidades ──────────────────────────── */}
            <section className="mb-10">
                <h2 className="text-[20px] font-semibold mb-1">Tutorial completo</h2>
                <p className="text-[13px] mb-6" style={{ color: "var(--text-muted)" }}>
                    Tudo o que você pode fazer no app, seção por seção.
                </p>

                <div className="space-y-4">
                    {features.map((feat, idx) => (
                        <FeatureCard key={feat.title} feat={feat} index={idx} />
                    ))}
                </div>
            </section>

            {/* ── Como importar — passo a passo ────────────────────────── */}
            <section className="mb-10">
                <h2 className="text-[20px] font-semibold mb-1">Por onde começar?</h2>
                <p className="text-[13px] mb-6" style={{ color: "var(--text-muted)" }}>
                    O fluxo recomendado para tirar o máximo do Finance Friend.
                </p>
                <div className="space-y-3">
                    {[
                        {
                            step: "01",
                            title: "Importe seu extrato",
                            body: "Vá em Importar, baixe o CSV do seu banco (Nubank, C6, Inter etc.) e faça o upload. A IA processa em segundos.",
                        },
                        {
                            step: "02",
                            title: "Revise as categorias",
                            body: "Em Transações, filtre o mês recém importado e corrija qualquer categoria que a IA errou. Ela aprende com suas correções.",
                        },
                        {
                            step: "03",
                            title: "Configure orçamentos",
                            body: "Em Orçamentos, crie limites para suas categorias principais. Isso ativa os alertas automáticos.",
                        },
                        {
                            step: "04",
                            title: "Crie suas metas",
                            body: "Em Metas, registre o que você está guardando dinheiro. O Copiloto vai te ajudar a calcular quanto poupar por mês.",
                        },
                        {
                            step: "05",
                            title: "Converse com o Copiloto",
                            body: "Abra o Copiloto e explore! Pergunte qualquer coisa. Peça gráficos, análises, comparações. Quanto mais você usa, mais ele ajuda.",
                        },
                    ].map((s) => (
                        <div
                            key={s.step}
                            className="flex gap-4 rounded-[8px] border p-4"
                            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                        >
                            <div
                                className="shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center text-[12px] font-semibold"
                                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                            >
                                {s.step}
                            </div>
                            <div>
                                <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                                    {s.title}
                                </p>
                                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                                    {s.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Bancos suportados ────────────────────────────────────── */}
            <section className="mb-10">
                <h2 className="text-[20px] font-semibold mb-1">Bancos suportados</h2>
                <p className="text-[13px] mb-5" style={{ color: "var(--text-muted)" }}>
                    O importador detecta o formato automaticamente — sem configuração.
                </p>
                <div className="flex flex-wrap gap-2">
                    {[
                        "Nubank Crédito", "Nubank Conta", "C6 Crédito", "C6 Conta",
                        "Inter Crédito", "Inter Conta", "Santander Crédito", "Santander Conta",
                        "Bradesco Crédito", "Bradesco Conta", "Itaú Conta", "BB Crédito",
                        "BB Conta", "Caixa Conta", "BTG Crédito", "BTG Conta",
                        "XP Crédito",
                    ].map((bank) => (
                        <span
                            key={bank}
                            className="px-3 py-1.5 rounded-[6px] border text-[12px]"
                            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                        >
                            {bank}
                        </span>
                    ))}
                </div>
            </section>

            {/* ── Beta notice ─────────────────────────────────────────── */}
            <section className="mb-10">
                <div
                    className="rounded-[8px] border p-5"
                    style={{ background: "rgba(234,179,8,0.05)", borderColor: "rgba(234,179,8,0.2)" }}
                >
                    <div className="flex items-start gap-3">
                        <Shield size={18} className="shrink-0 mt-0.5" style={{ color: "#eab308" }} />
                        <div>
                            <p className="text-[13px] font-medium mb-1" style={{ color: "#eab308" }}>
                                Beta fechada — o que isso significa
                            </p>
                            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                Esta versão é exclusiva para pessoas de confiança. Podem haver bugs, funcionalidades incompletas e mudanças frequentes. Seus dados estão seguros — eles ficam no meu servidor privado e nunca são compartilhados. O objetivo agora é coletar feedback real para evoluir o produto.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Feedback CTA ─────────────────────────────────────────── */}
            <section>
                <div
                    className="rounded-[10px] border p-6 sm:p-8 text-center"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                    <Image
                        src="/images/leo-portrait.jpeg"
                        alt="Leonardo Ramos"
                        width={56}
                        height={56}
                        className="rounded-full object-cover mx-auto mb-4"
                        style={{ border: "2px solid var(--border)" }}
                    />
                    <h2 className="text-[20px] font-semibold mb-2">Seu feedback é essencial</h2>
                    <p className="text-[14px] leading-relaxed mb-6 max-w-[480px] mx-auto" style={{ color: "var(--text-secondary)" }}>
                        Encontrou um bug? Algo não ficou claro? Tem uma ideia de funcionalidade? Me conta! Cada feedback vai diretamente para mim e faz o Finance Friend melhorar.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                            href="https://wa.me/5511955511976"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[6px] text-[13px] font-medium transition-opacity w-full sm:w-auto"
                            style={{ background: "#25d366", color: "#fff" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp
                        </a>
                        <a
                            href="mailto:leoanrdo@elytraai.com.br"
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[6px] border text-[13px] font-medium transition-colors w-full sm:w-auto"
                            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="16" x="2" y="4" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            leoanrdo@elytraai.com.br
                        </a>
                    </div>
                </div>

                {/* Ir pro app */}
                <div className="flex justify-center mt-8">
                    <Link
                        href="/copiloto"
                        className="flex items-center gap-2 px-6 py-3 rounded-[6px] text-[14px] font-medium transition-opacity"
                        style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    >
                        Começar a explorar
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </div>
    );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({
    feat,
    index,
}: {
    feat: (typeof features)[0];
    index: number;
}) {
    return (
        <div
            className="rounded-[8px] border overflow-hidden"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center shrink-0"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                        <feat.icon size={16} style={{ color: "var(--text-primary)" }} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
                                {feat.title}
                            </span>
                            <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                            >
                                {String(index + 1).padStart(2, "0")}
                            </span>
                        </div>
                        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                            {feat.tagline}
                        </span>
                    </div>
                </div>
                <Link
                    href={feat.href}
                    className="flex items-center gap-1 text-[12px] transition-colors shrink-0"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                    Abrir <ArrowRight size={12} />
                </Link>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                    {feat.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* O que você pode fazer */}
                    <div>
                        <p className="text-[11px] font-medium mb-2 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                            O que você pode fazer
                        </p>
                        <ul className="space-y-1.5">
                            {feat.tips.map((tip) => (
                                <li key={tip} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                                    <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: "var(--text-muted)" }} />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Como usar */}
                    <div
                        className="rounded-[6px] px-4 py-3"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                        <p className="text-[11px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                            Como usar
                        </p>
                        <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            {feat.howTo}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
