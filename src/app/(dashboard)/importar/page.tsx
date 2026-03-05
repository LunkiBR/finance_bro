"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, CheckCircle, Loader, Circle, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

// These stages map 1:1 to what actually happens in the n8n pipeline.
// The first stage (Enviando) is resolved the moment the HTTP request leaves.
// Stages 2-4 happen server-side in n8n — we can't get live updates,
// but we advance them on a realistic timer while waiting for the response.
// Stage 5 (Concluído) is only set when we get a successful response.
type Stage = "idle" | "enviando" | "parseando" | "categorizando" | "importando" | "done" | "error";

interface UploadResult {
    transactions: number | null;
}

const PIPELINE_STAGES: { key: Stage; label: string; detail: string }[] = [
    { key: "enviando", label: "Enviando arquivo", detail: "Transferindo o CSV para o servidor..." },
    { key: "parseando", label: "Lendo transações", detail: "Detectando formato e analisando cada linha..." },
    { key: "categorizando", label: "Categorizando com IA", detail: "Inteligência Artificial classificando cada transação..." },
    { key: "importando", label: "Salvando no banco", detail: "Inserindo transações e atualizando orçamentos..." },
    { key: "done", label: "Concluído", detail: "" },
];

const STAGE_ORDER: Stage[] = ["enviando", "parseando", "categorizando", "importando", "done"];

function stageIndex(s: Stage): number {
    return STAGE_ORDER.indexOf(s);
}

export default function ImportarPage() {
    const [stage, setStage] = useState<Stage>("idle");
    const [fileName, setFileName] = useState("");
    const [fileSize, setFileSize] = useState("");
    const [result, setResult] = useState<UploadResult | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Advance through middle stages automatically while waiting for n8n.
    // Each stage represents a real n8n node that is actually running.
    // Timings are conservative minimums — we stop at "importando" and only
    // advance to "done" when the real server response arrives.
    function startProgressTimer() {
        // Parse stage after 1s (n8n parses CSV quickly)
        timerRef.current = setTimeout(() => {
            setStage(s => s === "enviando" ? "parseando" : s);
            // Categorization stage after another 2s (AI call)
            timerRef.current = setTimeout(() => {
                setStage(s => s === "parseando" ? "categorizando" : s);
                // Import stage after another 5s (DB writes, budget checks)
                timerRef.current = setTimeout(() => {
                    setStage(s => s === "categorizando" ? "importando" : s);
                }, 5000);
            }, 2000);
        }, 1000);
    }

    function clearTimer() {
        if (timerRef.current) clearTimeout(timerRef.current);
    }

    async function handleFile(file: File) {
        setFileName(file.name);
        setFileSize(`${Math.round(file.size / 1024)} KB`);
        setResult(null);
        setErrorMsg("");
        setStage("enviando");
        startProgressTimer();

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            clearTimer();

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErrorMsg(data.error || `Erro do servidor (${res.status}).`);
                setStage("error");
                return;
            }

            const data = await res.json();
            setResult({ transactions: data.transactions ?? 0 });
            setStage("done");
        } catch (err) {
            clearTimer();
            setErrorMsg("Não foi possível conectar ao servidor. Verifique sua conexão.");
            setStage("error");
            console.error(err);
        }
    }

    // Clean up timers on unmount
    useEffect(() => () => clearTimer(), []);

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

    function StageIcon({ stageKey }: { stageKey: Stage }) {
        const current = stageIndex(stage);
        const item = stageIndex(stageKey);

        if (stage === "error" && item >= current) {
            if (item === current) return <AlertTriangle size={16} style={{ color: "var(--accent-red)" }} />;
            return <Circle size={16} style={{ color: "var(--text-muted)" }} />;
        }
        if (stage === "done" || item < current) {
            return <CheckCircle size={16} style={{ color: "var(--accent-green)" }} />;
        }
        if (stageKey === stage) {
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

            {/* Progress panel */}
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

                    <div className="space-y-4">
                        {PIPELINE_STAGES.map((s) => {
                            const current = stageIndex(stage);
                            const item = stageIndex(s.key);
                            const isActive = s.key === stage && stage !== "done" && stage !== "error";
                            const isPast = current > item || stage === "done";
                            const isFuture = !isActive && !isPast;

                            return (
                                <div key={s.key} className="flex items-start gap-3">
                                    <div className="mt-[1px] flex-shrink-0">
                                        <StageIcon stageKey={s.key} />
                                    </div>
                                    <div>
                                        <p
                                            className="text-[13px] leading-none"
                                            style={{
                                                color: isActive
                                                    ? "var(--text-primary)"
                                                    : isPast
                                                        ? "var(--accent-green)"
                                                        : "var(--text-muted)",
                                                fontWeight: isActive ? 500 : 400,
                                            }}
                                        >
                                            {s.label}
                                        </p>
                                        {isActive && s.detail && (
                                            <p className="text-caption mt-1" style={{ color: "var(--text-secondary)" }}>
                                                {s.detail}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Error state */}
                    {stage === "error" && (
                        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                            <p className="text-[13px] mb-3" style={{ color: "var(--accent-red)" }}>
                                ⚠ {errorMsg || "Erro ao processar o arquivo. Verifique o formato e tente novamente."}
                            </p>
                            <button
                                onClick={() => { setStage("idle"); setResult(null); setErrorMsg(""); }}
                                className="text-caption transition-opacity hover:opacity-80"
                                style={{ color: "var(--accent-blue)" }}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {/* Success state */}
                    {stage === "done" && result !== null && (
                        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                            {(result.transactions ?? 0) > 0 ? (
                                <p className="text-[13px] mb-3" style={{ color: "var(--accent-green)" }}>
                                    ✓ {result.transactions} transaç{result.transactions === 1 ? "ão importada" : "ões importadas"} com sucesso
                                </p>
                            ) : (
                                <p className="text-[13px] mb-3" style={{ color: "var(--text-secondary)" }}>
                                    ✓ Arquivo processado. Nenhuma transação nova foi encontrada (possível duplicata ou CSV vazio).
                                </p>
                            )}
                            <button
                                onClick={() => { setStage("idle"); setResult(null); }}
                                className="text-caption transition-opacity hover:opacity-80"
                                style={{ color: "var(--accent-blue)" }}
                            >
                                Importar outro arquivo
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
                        <p className="mb-2 font-medium" style={{ color: "var(--text-secondary)" }}>Cartão de Crédito:</p>
                        <ol className="list-decimal space-y-1 mb-4">
                            <li>Abra o app do Nubank</li>
                            <li>Vá em <strong>Cartão de Crédito → Fatura</strong></li>
                            <li>Toque em &quot;Exportar fatura&quot;</li>
                            <li>Selecione o período e &quot;Salvar CSV&quot;</li>
                        </ol>
                        <p className="mb-2 font-medium" style={{ color: "var(--text-secondary)" }}>Conta Corrente (extrato):</p>
                        <ol className="list-decimal space-y-1">
                            <li>Abra o app do Nubank</li>
                            <li>Vá em <strong>Extrato</strong></li>
                            <li>Toque em <strong>⋯ → Exportar extrato</strong></li>
                            <li>Selecione o período e baixe o CSV</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}
