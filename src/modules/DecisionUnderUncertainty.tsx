"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { fmt } from "@/lib/format";
import { rng32, sampleNormal } from "@/lib/distributions";
import { Slider } from "./ProbabilityEngine";
import type { Bilingual } from "@/i18n/dict";

type Decision = {
  id: string;
  name: Bilingual;
  desc: Bilingual;
  payoff: { mean: number; sd: number; tailProb: number; tailValue: number; reversibility: number };
};

const DECISIONS: Decision[] = [
  {
    id: "concentrate",
    name: { en: "Concentrate on one bet", zh: "集中下注" },
    desc: {
      en: "Allocate all capital to the highest-EV opportunity. Highest mean, lowest optionality, irreversible.",
      zh: "把全部资本压在期望值最高的机会上。均值最高、期权最低、几乎不可逆。",
    },
    payoff: { mean: 22, sd: 28, tailProb: 0.07, tailValue: -65, reversibility: 0.10 },
  },
  {
    id: "barbell",
    name: { en: "Barbell: safe + speculative", zh: "杠铃：安全 + 投机" },
    desc: {
      en: "Most capital in safe instruments, small fraction in convex bets. Caps downside, preserves upside tail.",
      zh: "多数资本配置安全工具，小部分配置凸性头寸。封顶下行、保留上行尾部。",
    },
    payoff: { mean: 11, sd: 14, tailProb: 0.02, tailValue: -18, reversibility: 0.55 },
  },
  {
    id: "diversified",
    name: { en: "Broad diversification", zh: "广泛分散" },
    desc: {
      en: "Spread across many uncorrelated bets. Mean lower, variance lower, optionality moderate.",
      zh: "在多个不相关项之间分散。均值更低，方差更低，期权中等。",
    },
    payoff: { mean: 9, sd: 9, tailProb: 0.01, tailValue: -10, reversibility: 0.70 },
  },
  {
    id: "wait",
    name: { en: "Wait & gather information", zh: "等待并收集信息" },
    desc: {
      en: "Defer commitment. Pay an opportunity cost; receive an information option that may flip the decision.",
      zh: "暂缓承诺。付出机会成本，换取可能翻转决策的信息期权。",
    },
    payoff: { mean: 4, sd: 6, tailProb: 0.005, tailValue: -6, reversibility: 0.95 },
  },
];

export function DecisionUnderUncertainty() {
  const { B, lang } = useLang();
  const [aversion, setAversion] = useState(0.6);   // 0..1
  const [optWeight, setOptWeight] = useState(0.4); // 0..1
  const [tailWeight, setTailWeight] = useState(1.6);

  const scored = useMemo(() => DECISIONS.map(d => {
    const riskPenalty = aversion * d.payoff.sd + tailWeight * d.payoff.tailProb * Math.abs(d.payoff.tailValue);
    const optionality = optWeight * d.payoff.reversibility * Math.abs(d.payoff.mean);
    const score = d.payoff.mean - riskPenalty + optionality;
    return { d, score, riskPenalty, optionality };
  }).sort((a, b) => b.score - a.score), [aversion, optWeight, tailWeight]);

  const best = scored[0];

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-8">
      <div>
        <div className="k mb-3">{lang === "zh" ? "偏好参数" : "Preference parameters"}</div>
        <div className="space-y-4">
          <Slider label={lang === "zh" ? "风险厌恶 λ" : "Risk aversion λ"} value={aversion} min={0} max={1.4} step={0.02} onChange={setAversion} />
          <Slider label={lang === "zh" ? "尾部惩罚 κ" : "Tail penalty κ"} value={tailWeight} min={0} max={4} step={0.05} onChange={setTailWeight} />
          <Slider label={lang === "zh" ? "期权权重 ω" : "Optionality ω"} value={optWeight} min={0} max={1.5} step={0.02} onChange={setOptWeight} />
        </div>

        <div className="card p-4 mt-7">
          <div className="k mb-2">{lang === "zh" ? "评分公式" : "Scoring formula"}</div>
          <pre className="font-mono text-[11px] text-[var(--ink-soft)] leading-relaxed whitespace-pre-wrap">
{`Score(d) = E[d]
  − λ · σ(d)
  − κ · P(tail) · |tail|
  + ω · reversibility · |E[d]|`}
          </pre>
        </div>
      </div>

      <div className="space-y-5">
        <div className="card p-5">
          <div className="k mb-3">{lang === "zh" ? "决策对比" : "Decision comparison"}</div>
          <div className="space-y-3">
            {scored.map(({ d, score, riskPenalty, optionality }, i) => (
              <DecisionRow key={d.id} d={d} score={score} riskPenalty={riskPenalty} optionality={optionality}
                          rank={i} best={best.score} lang={lang} B={B} />
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="k mb-2">{lang === "zh" ? "选择 →" : "Recommendation →"}</div>
          <h3 className="text-2xl font-medium mb-1">{B(best.d.name)}</h3>
          <p className="text-[14px] text-[var(--ink-soft)] leading-relaxed mb-4">{B(best.d.desc)}</p>
          <p className="text-[13px] italic font-serif text-[var(--ink)] border-l-2 border-[var(--accent)] pl-4">
            {lang === "zh"
              ? "这不是「最佳决策」。这是在你当前的 λ、κ、ω 下，期望值减去风险惩罚再加期权价值最高的决策。改变偏好，排序立即变化。这就是「在不确定性下的决策」。"
              : "This is not the best decision. It is the decision whose expected value, minus the risk penalty, plus the optionality value, is highest given your λ, κ, ω. Change preferences and the ranking flips. That is decision-making under uncertainty."}
          </p>
        </div>

        <PayoffSimulator decisions={DECISIONS} />
      </div>
    </div>
  );
}

function DecisionRow({ d, score, riskPenalty, optionality, rank, best, lang, B }:
  { d: Decision; score: number; riskPenalty: number; optionality: number; rank: number; best: number; lang: "en" | "zh"; B: (b: Bilingual) => string }) {
  const isBest = rank === 0;
  return (
    <div className={`p-4 border transition-all
      ${isBest ? "border-[var(--accent)] bg-[rgba(94,234,212,0.05)]" : "border-[var(--line)]"}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className={`font-mono text-[11px] uppercase tracking-[0.16em] ${isBest ? "text-[var(--accent)]" : "text-[var(--ink-dim)]"}`}>
            #{rank + 1}
          </span>
          <span className="text-[15px] font-medium">{B(d.name)}</span>
        </div>
        <div className="font-mono text-[14px]">
          <span className={isBest ? "text-[var(--accent)]" : ""}>{fmt(score, 2)}</span>
        </div>
      </div>
      <div className="text-[12px] text-[var(--ink-soft)] mb-3 measure">{B(d.desc)}</div>
      <div className="grid grid-cols-4 gap-3 text-[11px] font-mono">
        <Mini k={lang === "zh" ? "均值" : "E[·]"} v={fmt(d.payoff.mean, 1)} tone="good" />
        <Mini k={lang === "zh" ? "σ" : "σ"} v={fmt(d.payoff.sd, 1)} />
        <Mini k={lang === "zh" ? "尾部" : "tail"} v={`${(d.payoff.tailProb * 100).toFixed(1)}% · ${d.payoff.tailValue}`} tone="bad" />
        <Mini k={lang === "zh" ? "可逆" : "rev"} v={(d.payoff.reversibility * 100).toFixed(0) + "%"} />
      </div>
      <div className="h-1 mt-3 bg-[var(--bg-elev-2)] flex">
        <div className="h-full bg-[var(--good)]" style={{ width: `${(d.payoff.mean / 25) * 100}%`, maxWidth: "60%" }} />
        <div className="h-full bg-[var(--bad)] opacity-70" style={{ width: `${(riskPenalty / 60) * 100}%`, maxWidth: "30%" }} />
        <div className="h-full bg-[var(--baseline)] opacity-70" style={{ width: `${(optionality / 25) * 100}%`, maxWidth: "30%" }} />
      </div>
    </div>
  );
}

function Mini({ k, v, tone }: { k: string; v: string; tone?: "good" | "bad" }) {
  return (
    <div className="flex flex-col">
      <span className="text-[var(--ink-dim)] text-[10px] uppercase tracking-[0.16em]">{k}</span>
      <span className={`mt-0.5 ${tone === "good" ? "text-[var(--good)]" : tone === "bad" ? "text-[var(--bad)]" : ""}`}>{v}</span>
    </div>
  );
}

function PayoffSimulator({ decisions }: { decisions: Decision[] }) {
  const { lang } = useLang();
  const [seed, setSeed] = useState(7);

  // Simulate one realization across decisions: same noise input, different scaling
  const rng = rng32(seed);
  const samples = decisions.map(d => {
    const tailHit = rng() < d.payoff.tailProb;
    return tailHit ? d.payoff.tailValue : sampleNormal(rng, d.payoff.mean, d.payoff.sd);
  });
  const min = Math.min(...samples, -70);
  const max = Math.max(...samples, 50);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="k">{lang === "zh" ? "单次实现（按种子重抽）" : "One realization (re-roll by seed)"}</div>
        <button className="btn !py-1" onClick={() => setSeed(s => (s + 1) % 1e6)}>
          ↻ {lang === "zh" ? "再抽一次" : "Re-roll"} · seed {seed}
        </button>
      </div>
      <div className="space-y-2">
        {decisions.map((d, i) => {
          const v = samples[i];
          const widthPct = ((v - min) / (max - min)) * 100;
          const zeroPct = ((0 - min) / (max - min)) * 100;
          return (
            <div key={d.id} className="flex items-center gap-3 text-[12px]">
              <span className="w-44 text-[var(--ink-soft)] truncate">{d.name.en}</span>
              <div className="flex-1 h-2 bg-[var(--bg-elev-2)] relative">
                <span className="absolute top-0 bottom-0 w-px bg-[var(--line)]" style={{ left: `${zeroPct}%` }} />
                <span className={`absolute top-0 bottom-0 ${v >= 0 ? "bg-[var(--good)]" : "bg-[var(--bad)]"}`}
                  style={{ left: `${Math.min(zeroPct, widthPct)}%`, width: `${Math.abs(widthPct - zeroPct)}%` }} />
              </div>
              <span className={`w-16 font-mono text-right ${v >= 0 ? "text-[var(--good)]" : "text-[var(--bad)]"}`}>
                {v >= 0 ? "+" : ""}{fmt(v, 1)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[12px] text-[var(--ink-soft)] mt-4 leading-relaxed">
        {lang === "zh"
          ? "在足够多次抽样下，分散与杠铃通常胜出；但在任何一次抽样里，集中可能领先。这正是为何「在单次结果上评判决策」会让你长期破产。"
          : "Across many rolls, diversification and the barbell tend to win — but on any single roll, concentration can lead. Judging a decision by one outcome is the canonical way to go broke over time."}
      </p>
    </div>
  );
}
