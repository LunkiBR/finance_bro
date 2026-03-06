"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Upload, CheckCircle, Loader, Circle, ChevronDown, ChevronUp, AlertTriangle, FileText, X } from "lucide-react";

type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileEntry {
    file: File;
    status: FileStatus;
    result?: { transactions: number | null };
    error?: string;
}

export default function ImportarPage() {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [processing, setProcessing] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const totalDone = files.filter(f => f.status === "done").length;
    const totalErrors = files.filter(f => f.status === "error").length;
    const totalImported = files.reduce((sum, f) => sum + (f.result?.transactions ?? 0), 0);
    const allFinished = files.length > 0 && files.every(f => f.status === "done" || f.status === "error");

    async function processFiles(entries: FileEntry[]) {
        setProcessing(true);

        for (let i = 0; i < entries.length; i++) {
            // Mark current as uploading
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

            // Small delay between files to not overwhelm n8n
            if (i < entries.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        setProcessing(false);
    }

    function addFiles(newFiles: FileList | File[]) {
        const csvFiles = Array.from(newFiles).filter(f =>
            f.name.endsWith(".csv") || f.name.endsWith(".txt") || f.type === "text/csv"
        );
        if (csvFiles.length === 0) return;

        const entries: FileEntry[] = csvFiles.map(file => ({
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
            // Reset input so same files can be selected again
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

    function FileStatusIcon({ status }: { status: FileStatus }) {
        switch (status) {
            case "pending": return <Circle size={14} style={{ color: "var(--text-muted)" }} />;
            case "uploading": return <Loader size={14} className="animate-spin" style={{ color: "var(--accent-blue)" }} />;
            case "done": return <CheckCircle size={14} style={{ color: "var(--accent-green)" }} />;
            case "error": return <AlertTriangle size={14} style={{ color: "var(--accent-red)" }} />;
        }
    }

    return (
        <div>
            <h1 className="text-h1 mb-2" style={{ color: "var(--text-primary)" }}>Importar Extratos</h1>
            <p className="text-body mb-6" style={{ color: "var(--text-secondary)" }}>
                Arraste os CSVs do Nubank (cartão ou conta). Você pode importar vários de uma vez.
            </p>

            {/* Drop zone — always visible when not processing */}
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
                        {files.length > 0 ? "Adicionar mais arquivos" : "Arraste os CSVs do Nubank aqui"}
                    </p>
                    <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                        ou <span style={{ color: "var(--accent-blue)" }}>clique para selecionar</span> · Suporte: Nubank Cartão e Conta
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.txt"
                        multiple
                        className="hidden"
                        onChange={handleInputChange}
                    />
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div className="rounded-[6px] border divide-y" style={{ borderColor: "var(--border)", divideColor: "var(--border)" }}>
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

                            {/* Status text */}
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

                            {/* Remove button (only when idle/done/error and not processing) */}
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
                                Pronto! {totalImported} transacoes importadas de {totalDone} arquivo{totalDone !== 1 ? "s" : ""}.
                            </span>
                        ) : (
                            <span>
                                <span style={{ color: "var(--accent-green)" }}>{totalDone - totalErrors} OK</span>
                                {" · "}
                                <span style={{ color: "var(--accent-red)" }}>{totalErrors} erro{totalErrors !== 1 ? "s" : ""}</span>
                                {" · "}
                                {totalImported} transacoes importadas
                            </span>
                        )}
                    </p>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/transacoes"
                            className="text-caption transition-opacity hover:opacity-80"
                            style={{ color: "var(--accent-blue)" }}
                        >
                            Ver transacoes
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

            {/* Help accordion */}
            <div className="mt-8">
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex items-center gap-2 text-[13px] transition-opacity hover:opacity-80"
                    style={{ color: "var(--text-secondary)" }}
                >
                    {showHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Como exportar o CSV do Nubank?
                </button>
                {showHelp && (
                    <div className="mt-3 pl-6 text-caption animate-fade-up" style={{ color: "var(--text-muted)", lineHeight: "1.8" }}>
                        <p className="mb-2 font-medium" style={{ color: "var(--text-secondary)" }}>Cartão de Crédito:</p>
                        <ol className="list-decimal space-y-1 mb-4">
                            <li>Abra o app do Nubank</li>
                            <li>Vá em <strong>Cartão de Crédito &rarr; Fatura</strong></li>
                            <li>Toque em &quot;Exportar fatura&quot;</li>
                            <li>Selecione o período e &quot;Salvar CSV&quot;</li>
                        </ol>
                        <p className="mb-2 font-medium" style={{ color: "var(--text-secondary)" }}>Conta Corrente (extrato):</p>
                        <ol className="list-decimal space-y-1">
                            <li>Abra o app do Nubank</li>
                            <li>Vá em <strong>Extrato</strong></li>
                            <li>Toque em <strong>&hellip; &rarr; Exportar extrato</strong></li>
                            <li>Selecione o período e baixe o CSV</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}
