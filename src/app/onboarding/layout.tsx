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
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-0">
                <span
                    className="text-[13px]"
                    style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.01em" }}
                >
                    Finance Friend
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center px-5 py-8">
                {children}
            </div>
        </div>
    );
}
