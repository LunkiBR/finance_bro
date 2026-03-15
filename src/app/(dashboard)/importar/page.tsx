"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Upload, CheckCircle, Loader, Circle, AlertTriangle, FileText, X } from "lucide-react";

/* ─── Types ─── */

type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileEntry {
    file: File;
    status: FileStatus;
    result?: { transactions: number | null };
    error?: string;
}

type CsvSupport = "native" | "via_excel" | "pdf_only";

interface BankProduct {
    label: string;
    support: CsvSupport;
    supportNote?: string;
    steps: string[];
}

interface BankInfo {
    id: string;
    name: string;
    color: string;
    products: BankProduct[];
}

/* ─── Bank Data ─── */

const BANKS: BankInfo[] = [
    {
        id: "nubank",
        name: "Nubank",
        color: "#820AD1",
        products: [
            {
                label: "Conta Corrente",
                support: "native",
                supportNote: "CSV enviado por e-mail. Confira se o e-mail cadastrado está atualizado.",
                steps: [
                    "Abra o app Nubank e toque no card da <strong>Conta</strong>",
                    "Abaixo do saldo, toque em <strong>\"Pedir Extrato\"</strong>",
                    "Selecione o <strong>mês desejado</strong>",
                    "Toque em <strong>\"Exportar Extrato\"</strong>",
                    "O arquivo CSV será enviado para o <strong>e-mail cadastrado</strong>",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "native",
                supportNote: "Apenas faturas fechadas podem ser exportadas em CSV. Faturas abertas não possuem exportação.",
                steps: [
                    "Na tela inicial, toque no card do <strong>Cartão de Crédito</strong>",
                    "Deslize e selecione a <strong>fatura fechada desejada</strong>",
                    "Toque nos <strong>três pontinhos (⋮)</strong> no canto superior",
                    "Toque em <strong>\"Exportar fatura\"</strong>",
                    "Escolha o formato <strong>CSV</strong> — o arquivo é enviado ao e-mail",
                ],
            },
        ],
    },
    {
        id: "bb",
        name: "Banco do Brasil",
        color: "#FFEF00",
        products: [
            {
                label: "Conta Corrente",
                support: "native",
                supportNote: "CSV disponível apenas no Internet Banking via computador. O app exporta apenas PDF.",
                steps: [
                    "Acesse <strong>bb.com.br</strong> no computador e faça login",
                    "Navegue até <strong>Conta Corrente → Consultar → Extrato</strong>",
                    "Selecione o <strong>período desejado</strong>",
                    "Em <strong>\"Salvar no Formato\"</strong>, selecione <strong>\"Arquivo CSV (.csv)\"</strong>",
                    "Clique em <strong>OK</strong> e depois no <strong>ícone de disquete (💾)</strong>",
                    "O arquivo será salvo na pasta <strong>Downloads</strong>",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "via_excel",
                supportNote: "O BB exporta fatura em planilha (.xls). Baixe e envie o arquivo diretamente — Finance Friend converte automaticamente.",
                steps: [
                    "Acesse o <strong>Internet Banking</strong> no computador",
                    "Vá em <strong>Cartão → Faturas → Exportar</strong>",
                    "Escolha a fatura desejada",
                    "Selecione <strong>\"Exportar como Planilha\"</strong> (gera .xls ou .xlsx)",
                    "Envie o arquivo Excel diretamente no Finance Friend — sem precisar converter",
                ],
            },
        ],
    },
    {
        id: "itau",
        name: "Itaú",
        color: "#003399",
        products: [
            {
                label: "Conta Corrente",
                support: "native",
                supportNote: "Exportação mais confiável pelo Internet Banking no computador.",
                steps: [
                    "Acesse <strong>itau.com.br</strong> no computador e faça login",
                    "Vá em <strong>Conta Corrente → Extratos</strong>",
                    "Selecione o <strong>período desejado</strong>",
                    "Clique em <strong>\"Salvar/Exportar\"</strong> e selecione o formato <strong>CSV</strong>",
                    "Faça o download do arquivo",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "pdf_only",
                supportNote: "O Itaú não exporta fatura do cartão em CSV nativamente. Use a extensão de Chrome \"Itaú Exportar Fatura CSV/OFX\" (open source).",
                steps: [
                    "Instale a extensão <strong>\"Itaú Exportar Fatura CSV/OFX\"</strong> na Chrome Web Store",
                    "Acesse o <strong>Internet Banking do Itaú</strong> normalmente",
                    "Na página da fatura, o botão <strong>\"Exportar CSV\"</strong> aparecerá automaticamente",
                    "Clique no botão e faça o download",
                ],
            },
        ],
    },
    {
        id: "bradesco",
        name: "Bradesco",
        color: "#CC092F",
        products: [
            {
                label: "Conta Corrente",
                support: "native",
                supportNote: "Para CSV: use obrigatoriamente o computador. O app exporta apenas PDF.",
                steps: [
                    "Acesse <strong>banco.bradesco</strong> no computador e faça login",
                    "Vá em <strong>Saldos e Extratos → Extrato Mensal / Por Período</strong>",
                    "Defina o <strong>período</strong> e selecione a conta",
                    "Clique em <strong>\"Buscar\"</strong>",
                    "Selecione <strong>\"Salvar como arquivo\"</strong>",
                    "Escolha o formato <strong>CSV</strong> ou <strong>OFX</strong>",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "via_excel",
                supportNote: "CSV puro pode não estar disponível para todos os produtos. Use a opção de planilha disponível — Finance Friend aceita Excel diretamente.",
                steps: [
                    "Acesse o <strong>Internet Banking</strong> no computador",
                    "Vá em <strong>Cartões → Consultar Faturas</strong>",
                    "Escolha a fatura desejada",
                    "Utilize a opção de <strong>exportar/salvar</strong> como planilha (.xls/.xlsx)",
                    "Envie o arquivo Excel diretamente no Finance Friend",
                ],
            },
        ],
    },
    {
        id: "santander",
        name: "Santander",
        color: "#EC0000",
        products: [
            {
                label: "Conta Corrente",
                support: "via_excel",
                supportNote: "Santander não oferece CSV diretamente. Exporte em Excel e envie o arquivo — Finance Friend converte automaticamente.",
                steps: [
                    "Acesse <strong>santander.com.br</strong> no computador e faça login",
                    "Vá em <strong>Conta Corrente → Extrato (Money)</strong>",
                    "Selecione o <strong>período</strong> e clique em <strong>OK</strong>",
                    "Ao final da tela, clique em <strong>\"Exportar Excel\"</strong>",
                    "Envie o arquivo <strong>.xlsx</strong> diretamente no Finance Friend",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "pdf_only",
                supportNote: "Santander não oferece exportação de fatura em CSV. Apenas PDF disponível.",
                steps: [
                    "No app ou Internet Banking, acesse <strong>Cartão → Fatura</strong>",
                    "Baixe a fatura em <strong>PDF</strong>",
                    "Converta o PDF para CSV usando uma ferramenta online",
                ],
            },
        ],
    },
    {
        id: "caixa",
        name: "Caixa Econômica",
        color: "#005CA9",
        products: [
            {
                label: "Conta Corrente",
                support: "native",
                supportNote: "A Caixa gera OFX (aceito pelo Finance Friend). No app, apenas PDF está disponível — use o computador.",
                steps: [
                    "Acesse <strong>internetbanking.caixa.gov.br</strong>",
                    "Clique no menu <strong>☰</strong> (canto superior esquerdo)",
                    "Selecione <strong>\"Conta por Período\"</strong>",
                    "Escolha o período: <strong>Mês Atual</strong> ou customizado",
                    "Clique em <strong>\"Gerar Arquivo para Gerenciadores Financeiros\"</strong>",
                    "Selecione <strong>OFX</strong> (completo) e clique em <strong>Continuar</strong>",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "pdf_only",
                supportNote: "A Caixa não oferece exportação de fatura em CSV ou OFX.",
                steps: [
                    "No app ou Internet Banking, acesse a fatura do cartão",
                    "Baixe a fatura em <strong>PDF</strong>",
                ],
            },
        ],
    },
    {
        id: "inter",
        name: "Banco Inter",
        color: "#FF7A00",
        products: [
            {
                label: "Conta Corrente",
                support: "native",
                supportNote: "Um dos bancos mais amigáveis: suporta CSV, OFX e PDF direto no app. Até 2 anos de histórico.",
                steps: [
                    "Abra o <strong>Super App Inter</strong>",
                    "Vá em <strong>Conta Digital → Extrato</strong>",
                    "Selecione o <strong>período</strong> e aplique filtros se necessário",
                    "Toque nos <strong>três pontinhos (⋯)</strong> no canto superior",
                    "Toque em <strong>\"Exportar Extrato\"</strong>",
                    "Confirme os filtros e selecione o formato <strong>CSV</strong>",
                    "O arquivo é enviado ao <strong>e-mail cadastrado</strong>",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "native",
                steps: [
                    "Toque no card do <strong>Cartão de Crédito</strong>",
                    "Selecione a fatura desejada (aberta ou fechada)",
                    "Toque em <strong>\"Exportar\"</strong> ou nos <strong>três pontinhos</strong>",
                    "Escolha o formato <strong>CSV</strong>",
                ],
            },
        ],
    },
    {
        id: "c6",
        name: "C6 Bank",
        color: "#1A1A1A",
        products: [
            {
                label: "Conta Corrente",
                support: "native",
                steps: [
                    "Abra o <strong>app C6 Bank</strong>",
                    "Na tela inicial, toque em <strong>\"Extrato\"</strong> (abaixo do saldo)",
                    "Toque em <strong>\"Exportar Extrato\"</strong>",
                    "Selecione o <strong>período</strong> ou toque em <strong>\"Escolher outro período\"</strong>",
                    "Selecione o formato <strong>CSV</strong>",
                    "Toque em <strong>\"Exportar\"</strong>",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "native",
                supportNote: "Um dos únicos bancos a oferecer CSV nativo de fatura pelo app.",
                steps: [
                    "Abra o <strong>app C6 Bank</strong>",
                    "Toque no card do <strong>Cartão de Crédito</strong>",
                    "Acesse a <strong>fatura desejada</strong>",
                    "Toque em <strong>\"Exportar Fatura\"</strong>",
                    "Selecione o formato <strong>CSV</strong>",
                    "O arquivo é enviado ao <strong>e-mail cadastrado</strong>",
                ],
            },
        ],
    },
    {
        id: "xp",
        name: "XP / Rico",
        color: "#FFDD00",
        products: [
            {
                label: "Conta Corrente",
                support: "via_excel",
                supportNote: "XP exporta extrato em Excel ou OFX. Baixe o Excel e envie diretamente — Finance Friend converte automaticamente.",
                steps: [
                    "Acesse o app <strong>XP Investimentos</strong> ou <strong>xpi.com.br</strong>",
                    "Vá em <strong>Conta → Extrato</strong>",
                    "Selecione o <strong>período</strong>",
                    "Toque em <strong>Exportar</strong> ou ícone de download",
                    "Selecione <strong>Excel (.xlsx)</strong> ou <strong>OFX</strong>",
                    "Envie o arquivo diretamente no Finance Friend",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "via_excel",
                supportNote: "XP exporta fatura em Excel. Se aparecer a opção, baixe o arquivo e envie diretamente.",
                steps: [
                    "Abra o app <strong>XP Investimentos</strong>",
                    "Vá em <strong>Cartão de Crédito → Faturas</strong>",
                    "Selecione a fatura",
                    "Toque em <strong>\"Exportar\"</strong>",
                    "Selecione <strong>Excel (.xlsx)</strong> — envie diretamente no Finance Friend",
                ],
            },
        ],
    },
    {
        id: "btg",
        name: "BTG Pactual",
        color: "#00263E",
        products: [
            {
                label: "Conta Corrente",
                support: "via_excel",
                supportNote: "BTG exporta em Excel ou PDF. Baixe o Excel e envie diretamente — Finance Friend converte automaticamente.",
                steps: [
                    "Abra o app <strong>BTG Pactual Banking</strong>",
                    "Toque em <strong>Menu</strong> (canto inferior direito)",
                    "Toque em <strong>Conta</strong>",
                    "Toque no ícone de <strong>compartilhar/exportar</strong>",
                    "Selecione o <strong>período</strong>",
                    "Escolha <strong>Excel (.xlsx)</strong> — envie diretamente no Finance Friend",
                ],
            },
            {
                label: "Cartão de Crédito",
                support: "via_excel",
                supportNote: "BTG envia fatura em Excel (desde set/2025). Baixe e envie diretamente — sem precisar converter.",
                steps: [
                    "Abra o app <strong>BTG Pactual Banking</strong>",
                    "Acesse o <strong>Cartão de Crédito</strong>",
                    "Selecione a <strong>fatura desejada</strong>",
                    "Toque em <strong>Exportar</strong>",
                    "Selecione <strong>Excel (.xlsx)</strong> — envie diretamente no Finance Friend",
                ],
            },
        ],
    },
];

/* ─── Helper Components ─── */

function SupportBadge({ support }: { support: CsvSupport }) {
    const config = {
        native: { label: "CSV Nativo", bg: "rgba(0,166,126,0.12)", color: "var(--accent-green)" },
        via_excel: { label: "Excel aceito", bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
        pdf_only: { label: "Apenas PDF", bg: "rgba(229,72,77,0.12)", color: "var(--accent-red)" },
    }[support];
    return (
        <span
            className="px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: config.bg, color: config.color }}
        >
            {config.label}
        </span>
    );
}

function FileStatusIcon({ status }: { status: FileStatus }) {
    switch (status) {
        case "pending": return <Circle size={14} style={{ color: "var(--text-muted)" }} />;
        case "uploading": return <Loader size={14} className="animate-spin" style={{ color: "var(--accent-blue)" }} />;
        case "done": return <CheckCircle size={14} style={{ color: "var(--accent-green)" }} />;
        case "error": return <AlertTriangle size={14} style={{ color: "var(--accent-red)" }} />;
    }
}

/* ─── Main Component ─── */

export default function ImportarPage() {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [processing, setProcessing] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const totalDone = files.filter(f => f.status === "done").length;
    const totalErrors = files.filter(f => f.status === "error").length;
    const totalImported = files.reduce((sum, f) => sum + (f.result?.transactions ?? 0), 0);
    const allFinished = files.length > 0 && files.every(f => f.status === "done" || f.status === "error");

    const activeBank = BANKS.find(b => b.id === selectedBank);

    async function processFiles(entries: FileEntry[]) {
        setProcessing(true);

        for (let i = 0; i < entries.length; i++) {
            setFiles(prev => prev.map((f, idx) =>
                idx === i ? { ...f, status: "uploading" as const } : f
            ));

            const formData = new FormData();
            formData.append("file", entries[i].file);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    setFiles(prev => prev.map((f, idx) =>
                        idx === i ? { ...f, status: "error" as const, error: data.error || `Erro ${res.status}` } : f
                    ));
                } else {
                    const data = await res.json();
                    setFiles(prev => prev.map((f, idx) =>
                        idx === i ? { ...f, status: "done" as const, result: { transactions: data.transactions ?? 0 } } : f
                    ));
                }
            } catch {
                setFiles(prev => prev.map((f, idx) =>
                    idx === i ? { ...f, status: "error" as const, error: "Falha na conexão" } : f
                ));
            }

            if (i < entries.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        setProcessing(false);
    }

    function addFiles(newFiles: FileList | File[]) {
        const accepted = Array.from(newFiles).filter(f => {
            const name = f.name.toLowerCase();
            return name.endsWith(".csv") || name.endsWith(".txt") || name.endsWith(".pdf") ||
                name.endsWith(".xlsx") || name.endsWith(".xls") || f.type === "text/csv";
        });
        if (accepted.length === 0) return;

        const entries: FileEntry[] = accepted.map(file => ({
            file,
            status: "pending" as const,
        }));

        setFiles(prev => [...prev, ...entries]);
        processFiles(entries);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
            e.target.value = "";
        }
    }

    function reset() {
        setFiles([]);
        setProcessing(false);
    }

    function removeFile(idx: number) {
        if (processing) return;
        setFiles(prev => prev.filter((_, i) => i !== idx));
    }

    function formatSize(bytes: number): string {
        return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
    }

    return (
        <div>
            <h1 className="text-h1 mb-2" style={{ color: "var(--text-primary)" }}>Importar Extratos</h1>
            <p className="text-body mb-6" style={{ color: "var(--text-secondary)" }}>
                Arraste seus extratos (CSV, Excel ou PDF). Suporte a 10 bancos com detecção automática.
            </p>

            {/* Drop zone */}
            {!processing && (
                <div
                    className="rounded-[6px] border-2 border-dashed p-8 text-center cursor-pointer transition-colors mb-4"
                    style={{
                        borderColor: dragOver ? "var(--border-strong)" : "var(--border)",
                        background: dragOver ? "var(--bg-surface)" : "transparent",
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload size={28} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                    <p className="text-body mb-1" style={{ color: "var(--text-primary)" }}>
                        {files.length > 0 ? "Adicionar mais arquivos" : "Arraste seus extratos CSV aqui"}
                    </p>
                    <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                        ou <span style={{ color: "var(--accent-blue)" }}>clique para selecionar</span> · CSV, Excel e PDF · 10 bancos
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.txt,.pdf,.xlsx,.xls"
                        multiple
                        className="hidden"
                        onChange={handleInputChange}
                    />
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div className="rounded-[6px] border divide-y" style={{ borderColor: "var(--border)" }}>
                    {files.map((entry, idx) => (
                        <div
                            key={`${entry.file.name}-${idx}`}
                            className="flex items-center gap-3 px-4 py-3 text-[13px]"
                        >
                            <FileStatusIcon status={entry.status} />
                            <FileText size={14} style={{ color: "var(--text-muted)" }} />
                            <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                                {entry.file.name}
                            </span>
                            <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                                {formatSize(entry.file.size)}
                            </span>

                            {entry.status === "uploading" && (
                                <span className="text-caption" style={{ color: "var(--accent-blue)" }}>Processando...</span>
                            )}
                            {entry.status === "done" && (
                                <span className="text-caption" style={{ color: "var(--accent-green)" }}>
                                    {(entry.result?.transactions ?? 0) > 0
                                        ? `${entry.result?.transactions} importadas`
                                        : "Nenhuma nova (duplicatas)"}
                                </span>
                            )}
                            {entry.status === "error" && (
                                <span className="text-caption" style={{ color: "var(--accent-red)" }}>
                                    {entry.error || "Erro"}
                                </span>
                            )}

                            {!processing && entry.status !== "uploading" && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                    className="p-1 rounded transition-opacity hover:opacity-80"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Summary when all done */}
            {allFinished && (
                <div className="mt-4 rounded-[6px] p-4" style={{ background: "var(--bg-surface)" }}>
                    <p className="text-[13px] mb-3" style={{ color: "var(--text-primary)" }}>
                        {totalErrors === 0 ? (
                            <span style={{ color: "var(--accent-green)" }}>
                                Pronto! {totalImported} transações importadas de {totalDone} arquivo{totalDone !== 1 ? "s" : ""}.
                            </span>
                        ) : (
                            <span>
                                <span style={{ color: "var(--accent-green)" }}>{totalDone - totalErrors} OK</span>
                                {" · "}
                                <span style={{ color: "var(--accent-red)" }}>{totalErrors} erro{totalErrors !== 1 ? "s" : ""}</span>
                                {" · "}
                                {totalImported} transações importadas
                            </span>
                        )}
                    </p>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/transacoes"
                            className="text-caption transition-opacity hover:opacity-80"
                            style={{ color: "var(--accent-blue)" }}
                        >
                            Ver transações
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-caption transition-opacity hover:opacity-80"
                            style={{ color: "var(--accent-blue)" }}
                        >
                            Ver dashboard
                        </Link>
                        <button
                            onClick={reset}
                            className="text-caption transition-opacity hover:opacity-80"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Limpar lista
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Bank Guide Section ─── */}
            <div className="mt-8">
                <h2 className="text-[15px] font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                    Como exportar seu extrato?
                </h2>
                <p className="text-caption mb-4" style={{ color: "var(--text-muted)" }}>
                    Selecione seu banco para ver o passo a passo de exportação.
                </p>

                {/* Bank selector grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BANKS.map(bank => (
                        <button
                            key={bank.id}
                            onClick={() => {
                                setSelectedBank(prev => prev === bank.id ? null : bank.id);
                                setSelectedProduct(0);
                            }}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] border text-left text-[13px] transition-colors"
                            style={{
                                borderColor: selectedBank === bank.id ? bank.color : "var(--border)",
                                background: selectedBank === bank.id ? "var(--bg-elevated)" : "transparent",
                                color: selectedBank === bank.id ? "var(--text-primary)" : "var(--text-secondary)",
                                borderLeftWidth: "3px",
                                borderLeftColor: selectedBank === bank.id ? bank.color : "var(--border)",
                            }}
                        >
                            {bank.name}
                        </button>
                    ))}
                </div>

                {/* Expanded instructions */}
                {activeBank && (
                    <div className="mt-4 rounded-[6px] border p-4 animate-fade-up" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
                        {/* Product tabs */}
                        {activeBank.products.length > 1 && (
                            <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
                                {activeBank.products.map((product, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedProduct(idx)}
                                        className="px-4 py-2 text-[13px] -mb-px transition-colors"
                                        style={{
                                            color: selectedProduct === idx ? "var(--text-primary)" : "var(--text-muted)",
                                            borderBottom: selectedProduct === idx
                                                ? "2px solid var(--text-primary)"
                                                : "2px solid transparent",
                                            fontWeight: selectedProduct === idx ? 500 : 400,
                                        }}
                                    >
                                        {product.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Active product content */}
                        {(() => {
                            const product = activeBank.products[selectedProduct];
                            if (!product) return null;
                            return (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <SupportBadge support={product.support} />
                                    </div>
                                    {product.supportNote && (
                                        <p className="text-caption mb-3" style={{ color: "var(--text-muted)" }}>
                                            {product.supportNote}
                                        </p>
                                    )}
                                    <ol className="list-decimal pl-6 space-y-1.5 text-caption" style={{ color: "var(--text-secondary)", lineHeight: "1.8" }}>
                                        {product.steps.map((step, i) => (
                                            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
                                        ))}
                                    </ol>
                                </div>
                            );
                        })()}
                    </div>
                )}

                <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
                    Passos podem variar com atualizações do app. Última verificação: mar/2026.
                </p>
            </div>
        </div>
    );
}
