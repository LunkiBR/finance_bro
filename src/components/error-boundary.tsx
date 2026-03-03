"use client";

import React from "react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div
                    className="flex flex-col items-center justify-center min-h-[400px] gap-4"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                        style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        ⚠️
                    </div>
                    <div className="text-center">
                        <p
                            className="text-h3 mb-1"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Algo deu errado
                        </p>
                        <p className="text-caption" style={{ color: "var(--text-muted)" }}>
                            Ocorreu um erro inesperado ao carregar esta página.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer"
                        style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-strong)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                        }}
                    >
                        Tentar novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
