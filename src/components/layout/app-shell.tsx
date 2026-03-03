import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1200px] mx-auto px-8 py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
