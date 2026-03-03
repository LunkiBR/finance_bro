"use client";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: "var(--bg-base)" }}
        >
            {/* Progress bar */}
            <div className="w-full h-[1px]" style={{ background: "var(--border)" }} />

            {/* Logo */}
            <div className="px-6 py-4">
                <span
                    className="text-[13px]"
                    style={{ color: "var(--text-muted)", fontWeight: 500 }}
                >
                    Finance Friend
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}
