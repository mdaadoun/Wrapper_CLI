import type { Metadata } from "next";
import { Outfit, Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
});

export const metadata: Metadata = {
  title: "🚀 AIPE_Framework — Next.js TypeScript Industrial Dashboard",
  description:
    "Interactive Next.js TypeScript Dashboard for AI Product Engineering Blueprint & Portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${outfit.variable} ${inter.variable} ${firaCode.variable}`}>
      <body>{children}</body>
    </html>
  );
}
