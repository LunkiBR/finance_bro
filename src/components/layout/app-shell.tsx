import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { PageTransition } from "./page-transition";

export function AppShell({ children, fullWidth }: { children: React.ReactNode; fullWidth?: boolean }) {
    return (
        <div className="flex h-[100dvh] overflow-hidden flex-col md:flex-row" style={{ background: "var(--bg-base)" }}>
            <Sidebar />
            <main className={fullWidth ? "flex-1 overflow-hidden flex flex-col min-w-0" : "flex-1 overflow-y-auto relative"}>
                {fullWidth ? (
                    <PageTransition fullHeight>{children}</PageTransition>
                ) : (
                    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 pb-24 md:pb-6">
                        <PageTransition>{children}</PageTransition>
                    </div>
                )}
            </main>
            <MobileNav />
        </div>
    );
}
