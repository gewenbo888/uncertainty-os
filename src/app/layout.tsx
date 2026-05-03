import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Spectral } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LangProvider } from "@/i18n/LangProvider";

const display = Manrope({ variable: "--font-display", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });
const serif = Spectral({ variable: "--font-serif", subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://uncertainty-os.psyverse.fun"),
  title: "Uncertainty OS | 不确定性操作系统",
  description:
    "An operating system for thinking under uncertainty. Distributions over single estimates, scenarios over predictions, and decisions evaluated by expected value, risk penalty, and optionality. 一个用于不确定性下思考的系统：以分布替代点估、以情景替代预测、以期望值−风险惩罚+期权价值评估决策。",
  keywords: [
    "uncertainty", "probability", "decision under uncertainty", "tail risk",
    "Bayesian", "black swan", "fat tails", "scenario planning", "fan chart",
    "不确定性", "概率思考", "尾部风险", "黑天鹅", "情景分析", "决策框架"
  ],
  authors: [{ name: "Gewenbo", url: "https://psyverse.fun" }],
  alternates: {
    canonical: "/",
    languages: { en: "/", "zh-CN": "/", "x-default": "/" },
  },
  openGraph: {
    title: "Uncertainty OS — A system to model, navigate, and act under uncertainty",
    description: "Distributions over predictions. Scenarios over estimates. Decisions priced in tails.",
    url: "https://uncertainty-os.psyverse.fun/",
    siteName: "Psyverse",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Uncertainty OS",
    description: "A system to model, navigate, and act under uncertainty.",
  },
  robots: { index: true, follow: true },
  other: { "theme-color": "#0b0c10" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Script src="https://analytics-dashboard-two-blue.vercel.app/tracker.js" strategy="afterInteractive" />
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
