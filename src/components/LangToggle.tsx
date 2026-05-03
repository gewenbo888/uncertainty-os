"use client";
import { useLang } from "@/i18n/LangProvider";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex items-center border border-[var(--line)] rounded-sm overflow-hidden text-[11px] font-mono uppercase tracking-[0.18em]">
      <button onClick={() => setLang("en")} className={`px-2.5 py-1.5 transition-colors ${lang === "en" ? "bg-[var(--accent)] text-[#062018]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}>EN</button>
      <span className="w-px h-4 bg-[var(--line)]" />
      <button onClick={() => setLang("zh")} className={`px-2.5 py-1.5 transition-colors ${lang === "zh" ? "bg-[var(--accent)] text-[#062018]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}>中文</button>
    </div>
  );
}
