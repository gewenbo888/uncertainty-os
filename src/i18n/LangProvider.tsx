"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Bilingual, type Lang, type UIKey, ui } from "./dict";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  T: (key: UIKey) => string;
  B: (b: Bilingual) => string;
};

const LangCtx = createContext<Ctx | null>(null);
const STORAGE = "uos.lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem(STORAGE) as Lang | null) : null;
    if (stored === "en" || stored === "zh") setLangState(stored);
    else if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("zh")) setLangState("zh");
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE, l);
      document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
    }
  }, []);

  const toggle = useCallback(() => setLang(lang === "en" ? "zh" : "en"), [lang, setLang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      toggle,
      T: (key: UIKey) => ui[key][lang],
      B: (b: Bilingual) => b[lang],
    }),
    [lang, setLang, toggle]
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
