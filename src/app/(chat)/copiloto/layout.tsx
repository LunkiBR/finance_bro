import { AppShell } from "@/components/layout/app-shell";
import { ErrorBoundary } from "@/components/error-boundary";

export default function CopilotoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppShell fullWidth>
            <ErrorBoundary>{children}</ErrorBoundary>
        </AppShell>
    );
}
