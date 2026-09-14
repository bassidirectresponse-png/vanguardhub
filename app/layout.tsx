import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Vanguard Hub", description: "Operações de vendas, assinaturas e acessos" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
