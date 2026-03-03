import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

export const metadata: Metadata = {
    title: "Finance Friend | Seu Gestor Inteligente",
    description: "Acompanhe sua vida financeira com IA",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={`${outfit.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
