import { Sidebar } from "./sidebar";

export function AppShell({ children, fullWidth }: { children: React.ReactNode; fullWidth?: boolean }) {
    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
            <Sidebar />
            <main className={fullWidth ? "flex-1 overflow-hidden flex flex-col min-w-0" : "flex-1 overflow-y-auto"}>
                {fullWidth ? children : (
                    <div className="max-w-[1200px] mx-auto px-8 py-6">
                        {children}
                    </div>
                )}
            </main>
        </div>
    );
}
