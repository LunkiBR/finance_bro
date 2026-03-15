"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children, fullHeight }: { children: React.ReactNode; fullHeight?: boolean }) {
    const pathname = usePathname();
    return (
        <div key={pathname} className={`animate-page-enter${fullHeight ? " h-full" : ""}`}>
            {children}
        </div>
    );
}
