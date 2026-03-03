"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, Loader, Circle, ChevronDown, ChevronUp } from "lucide-react";

type UploadStage = "idle" | "uploading" | "processing" | "categorizing" | "importing" | "done" | "error";

interface UploadResult {
    transactions: number | null;
    alerts: number | null;
}

const STAGES = [
    { key: "uploading", label: "Enviando..." },
    { key: "processing", label: "Processando CSV..." },
    { key: "categorizing", label: "Categorizando..." },
    { key: "importing", label: "Importando..." },
    { key: "done", label: "Concluído" },
];

export default function ImportarPage() {
    const [stage, setStage] = useState<UploadStage>("idle");
    const [fileName, setFileName] = useState("");
    const [fileSize, setFileSize] = useState("");
    const [result, setResult] = useState<UploadResult | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        setFileName(file.name);
        setFileSize(`${Math.round(file.size / 1024)} KB`);
        setStage("uploading");
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            // Simulate stages for UX
            await new Promise((r) => setTimeout(r, 500));
            setStage("processing");
            await new Promise((r) => setTimeout(r, 400));
            setStage("categorizing");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            setStage("importing");
            await new Promise((r) => setTimeout(r, 600));

            setResult({
                transactions: data.transactions || 0,
                alerts: data.alerts || 0,
            });
            setStage("done");
        } catch {
            setStage("error");
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }

    function stageIcon(stageKey: string) {
        const stageIndex = STAGES.findIndex((s) => s.key === stageKey);
        const currentIndex = STAGES.findIndex((s) => s.key === stage);

        if (currentIndex > stageIndex || stage === "done") {
            return <CheckCircle size={16} style={{ color: "var(--accent-green)" }} />;
        }
        if (stage === stageKey) {
            return <Loader size={16} className="animate-spin" style={{ color: "var(--accent-blue)" }} />;
        }
        return <Circle size={16} style={{ color: "var(--text-muted)" }} />;
    }

    return (
        <div>
            <h1 className="text-h1 mb-2" style={{ color: "var(--text-primary)" }}>Importar Extratos</h1>
            <div className="text-body mb-6" style={{ color: "var(--text-secondary)" }}>
                <p className="mb-1">Como funciona:</p>
                <ol className="list-decimal ml-4 space-y-1 text-caption">
                    <li>Exporte o CSV pelo app do Nubank (Cartão ou Conta)</li>
                    <li>Faça o upload aqui</li>
                    <li>O Finance Friend categoriza e importa automaticamente</li>
                </ol>
            </div>

            {/* Drop zone */}
            {stage === "idle" && (
                <div
                    className="rounded-[6px] border-2 border-dashed p-12 text-center cursor-pointer transition-colors"
                    style={{
                        borderColor: dragOver ? "var(--border-strong)" : "var(--border)",
                        background: dragOver ? "var(--bg-surface)" : "transparent",
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload size={32} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                    <p className="text-body mb-1" style={{ color: "var(--text-primary)" }}>
                        Arraste o CSV do Nubank aqui
                    </p>
                    <p className="text-body mb-4" style={{ color: "var(--text-secondary)" }}>
                        ou <span style={{ color: "var(--accent-blue)", cursor: "pointer" }}>clique para selecionar</span>
                    </p>
                    <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                        Suporte: Nubank Cartão · Nubank Conta
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={handleInputChange}
                    />
                </div>
            )}

            {/* Progress */}
            {stage !== "idle" && (
                <div className="rounded-[6px] border p-6" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-[13px]" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                            {fileName}
                        </span>
                        <span className="text-caption" style={{ color: "var(--text-muted)" }}>
                            ({fileSize})
                        </span>
                    </div>

                    <div className="space-y-3">
                        {STAGES.map((s) => (
                            <div key={s.key} className="flex items-center gap-3">
                                {stageIcon(s.key)}
                                <span
                                    className="text-[13px]"
                                    style={{
                                        color: stage === s.key
                                            ? "var(--text-primary)"
                                            : STAGES.findIndex((x) => x.key === stage) > STAGES.findIndex((x) => x.key === s.key)
                                                ? "var(--accent-green)"
                                                : "var(--text-muted)",
                                    }}
                                >
                                    {STAGES.findIndex((x) => x.key === stage) > STAGES.findIndex((x) => x.key === s.key)
                                        ? s.label.replace("...", "")
                                        : s.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Result */}
                    {stage === "done" && result && (
                        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                            <p className="text-body mb-2" style={{ color: "var(--accent-green)" }}>
                                ✓ {result.transactions} transações importadas com sucesso
                            </p>
                            <button
                                onClick={() => { setStage("idle"); setResult(null); }}
                                className="text-caption mt-2 transition-opacity hover:opacity-80"
                                style={{ color: "var(--accent-blue)" }}
                            >
                                Importar outro arquivo
                            </button>
                        </div>
                    )}

                    {stage === "error" && (
                        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                            <p className="text-body mb-2" style={{ color: "var(--accent-red)" }}>
                                ⚠ Erro ao processar o arquivo. Verifique o formato e tente novamente.
                            </p>
                            <button
                                onClick={() => { setStage("idle"); setResult(null); }}
                                className="text-caption mt-2 transition-opacity hover:opacity-80"
                                style={{ color: "var(--accent-blue)" }}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}
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
                        <ol className="list-decimal space-y-1">
                            <li>Abra o app do Nubank</li>
                            <li>Vá em Cartão de Crédito → Fatura</li>
                            <li>Toque em &quot;Exportar fatura&quot;</li>
                            <li>Selecione o período e &quot;Salvar CSV&quot;</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}
