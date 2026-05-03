"use client";
import { useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { fmt, pct } from "@/lib/format";
import type { Bilingual } from "@/i18n/dict";

type Risk = {
  id: string;
  name: Bilingual;
  prob: number;       // 0..1
  impact: number;     // signed: negative = loss, positive = gain (units of percent of base)
  category: Bilingual;
  note: Bilingual;
};

const SEED: Risk[] = [
  { id: "r1", name: { en: "Demand surprise (positive)", zh: "需求超预期（正向）" }, prob: 0.35, impact: 18,
    category: { en: "Market", zh: "市场" }, note: { en: "Right-skewed product fit.", zh: "右偏的产品契合。" } },
  { id: "r2", name: { en: "Key customer churn", zh: "关键客户流失" }, prob: 0.18, impact: -22,
    category: { en: "Concentration", zh: "集中度" }, note: { en: "Single point of failure in revenue.", zh: "营收单点失败。" } },
  { id: "r3", name: { en: "Regulatory action", zh: "监管行动" }, prob: 0.06, impact: -55,
    category: { en: "Policy", zh: "政策" }, note: { en: "Low probability, business-altering impact.", zh: "低概率但改变商业模式。" } },
  { id: "r4", name: { en: "Cost inflation", zh: "成本通胀" }, prob: 0.5, impact: -7,
    category: { en: "Macro", zh: "宏观" }, note: { en: "High frequency, low impact each.", zh: "高频率，单次影响有限。" } },
  { id: "r5", name: { en: "Distribution windfall", zh: "渠道意外利好" }, prob: 0.12, impact: 30,
    category: { en: "Channel", zh: "渠道" }, note: { en: "Convex upside if a channel partnership lands.", zh: "若渠道合作落地，呈凸面上行。" } },
  { id: "r6", name: { en: "Cyber incident", zh: "网络安全事件" }, prob: 0.04, impact: -45,
    category: { en: "Operational", zh: "运营" }, note: { en: "Rare; tail-shaped.", zh: "稀有但尾部形态。" } },
];

export function RiskMap() {
  const { B, lang } = useLang();
  const [risks] = useState<Risk[]>(SEED);
  const [hover, setHover] = useState<string | null>(null);

  const ev = risks.reduce((s, r) => s + r.prob * r.impact, 0);
  const downside = risks.filter(r => r.impact < 0).reduce((s, r) => s + r.prob * r.impact, 0);
  const upside = risks.filter(r => r.impact > 0).reduce((s, r) => s + r.prob * r.impact, 0);
  const ratio = upside !== 0 ? Math.abs(downside) / upside : 0;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
      <div className="card p-5 dot-bg">
        <div className="flex items-center justify-between mb-2">
          <div className="k">{lang === "zh" ? "风险散点 — 概率 × 影响" : "Risk scatter — probability × impact"}</div>
          <div className="font-mono text-[10px] text-[var(--ink-dim)] uppercase tracking-[0.16em]">
            {lang === "zh" ? "气泡 = 期望值绝对值" : "bubble = |EV|"}
          </div>
        </div>
        <ScatterChart risks={risks} hover={hover} setHover={setHover} lang={lang} />
        <div className="grid grid-cols-3 gap-4 mt-4 text-[12px]">
          <Stat k={lang === "zh" ? "期望值合计" : "Sum EV"} v={fmt(ev, 1) + "%"} tone={ev >= 0 ? "good" : "bad"} />
          <Stat k={lang === "zh" ? "下行 EV" : "Downside EV"} v={fmt(downside, 1) + "%"} tone="bad" />
          <Stat k={lang === "zh" ? "上行 EV" : "Upside EV"} v={fmt(upside, 1) + "%"} tone="good" />
        </div>
      </div>

      <div className="space-y-5">
        <div className="card p-5">
          <div className="k mb-2">{lang === "zh" ? "非对称性诊断" : "Asymmetry diagnostic"}</div>
          <div className="text-[14px] mb-3">
            {ratio > 1.2 ? (
              <span><span className="text-[var(--bad)]">{lang === "zh" ? "下行偏向 " : "Downside-leaning. "}</span>
                {lang === "zh" ? "下行风险大约是上行潜力的 " : "Downside is ≈ "}
                <span className="font-mono">{fmt(ratio, 2)}×</span>{lang === "zh" ? " 倍。" : " your upside."}
              </span>
            ) : ratio < 0.8 ? (
              <span><span className="text-[var(--good)]">{lang === "zh" ? "上行偏向。" : "Upside-leaning. "}</span>
                {lang === "zh" ? "凸性结构。" : "Convex structure."}
              </span>
            ) : (
              <span><span className="text-[var(--baseline)]">{lang === "zh" ? "近似对称。" : "Roughly symmetric."}</span></span>
            )}
          </div>
          <div className="h-3 bg-[var(--bg-elev-2)] flex overflow-hidden">
            <div className="h-full bg-[var(--bad)]" style={{ flex: Math.abs(downside) }} />
            <div className="h-full bg-[var(--good)]" style={{ flex: Math.max(0.0001, upside) }} />
          </div>
          <div className="font-mono text-[10px] text-[var(--ink-dim)] uppercase tracking-[0.16em] flex justify-between mt-1">
            <span>{lang === "zh" ? "下行" : "Downside"}</span>
            <span>{lang === "zh" ? "上行" : "Upside"}</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="k mb-3">{lang === "zh" ? "风险清单" : "Risk register"}</div>
          <ul className="space-y-2">
            {risks.map(r => {
              const evR = r.prob * r.impact;
              return (
                <li key={r.id}
                  onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)}
                  className={`p-3 border text-[12px] cursor-pointer transition-all
                    ${hover === r.id ? "border-[var(--accent)] bg-[rgba(94,234,212,0.05)]" : "border-[var(--line)]"}`}>
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-[13px]">{B(r.name)}</span>
                    <span className={`font-mono text-[11px] ${r.impact > 0 ? "text-[var(--good)]" : "text-[var(--bad)]"}`}>
                      {r.impact > 0 ? "+" : ""}{r.impact}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[var(--ink-dim)] font-mono text-[10px] uppercase tracking-[0.16em]">
                    <span>p {pct(r.prob, 0)} · {B(r.category)}</span>
                    <span>EV {fmt(evR, 1)}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

const SW = 720, SH = 380, SP = { l: 50, r: 16, t: 16, b: 32 };

function ScatterChart({ risks, hover, setHover, lang }: { risks: Risk[]; hover: string | null; setHover: (s: string | null) => void; lang: "en" | "zh" }) {
  const sx = (p: number) => SP.l + p * (SW - SP.l - SP.r);
  // impact axis: -60 .. +60
  const sy = (impact: number) => {
    const mid = SH / 2;
    const range = 60;
    return mid - (impact / range) * (SH / 2 - SP.t);
  };
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-auto">
      {/* axis bg quadrants */}
      <rect x={SP.l} y={SP.t} width={SW - SP.l - SP.r} height={(SH - SP.t - SP.b)/2} fill="rgba(94,234,212,0.03)" />
      <rect x={SP.l} y={SH/2} width={SW - SP.l - SP.r} height={(SH - SP.t - SP.b)/2} fill="rgba(239,96,128,0.04)" />
      {/* gridlines */}
      {[0.1, 0.25, 0.5, 0.75, 0.9].map((p, i) => (
        <g key={i}>
          <line x1={sx(p)} y1={SP.t} x2={sx(p)} y2={SH - SP.b} stroke="var(--line-soft)" strokeDasharray="2 4" />
          <text x={sx(p)} y={SH - 14} fontSize={10} textAnchor="middle" fill="var(--ink-dim)" fontFamily="var(--font-mono)">
            {pct(p, 0)}
          </text>
        </g>
      ))}
      {[-50, -25, 0, 25, 50].map((v, i) => (
        <g key={i}>
          <line x1={SP.l} y1={sy(v)} x2={SW - SP.r} y2={sy(v)} stroke={v === 0 ? "var(--line)" : "var(--line-soft)"} strokeDasharray={v === 0 ? "" : "2 4"} />
          <text x={SP.l - 8} y={sy(v) + 3} fontSize={10} textAnchor="end" fill="var(--ink-dim)" fontFamily="var(--font-mono)">{v}%</text>
        </g>
      ))}
      <text x={SW - SP.r} y={SH - 4} fontSize={10} textAnchor="end" fill="var(--ink-dim)" fontFamily="var(--font-mono)">
        → {lang === "zh" ? "概率" : "Probability"}
      </text>
      <text x={SP.l - 30} y={SP.t + 10} fontSize={10} textAnchor="start" fill="var(--ink-dim)" fontFamily="var(--font-mono)">
        ↑ {lang === "zh" ? "影响" : "Impact %"}
      </text>

      {/* tail-region marker (low prob, large negative impact) */}
      <rect x={sx(0)} y={SP.t} width={sx(0.1) - sx(0)} height={(sy(-30) - SP.t) ? 0 : 0} />
      <text x={sx(0.04)} y={sy(-50) + 4} fontSize={10} fill="var(--tail)" fontFamily="var(--font-mono)">
        {lang === "zh" ? "黑天鹅区" : "Black-swan zone"}
      </text>
      <line x1={sx(0.1)} y1={SP.t} x2={sx(0.1)} y2={SH - SP.b} stroke="var(--tail)" strokeOpacity={0.35} strokeDasharray="3 3" />
      <line x1={SP.l} y1={sy(-30)} x2={SW - SP.r} y2={sy(-30)} stroke="var(--tail)" strokeOpacity={0.35} strokeDasharray="3 3" />

      {risks.map(r => {
        const ev = Math.abs(r.prob * r.impact);
        const radius = 6 + Math.min(20, ev * 1.2);
        const isHover = hover === r.id;
        return (
          <g key={r.id} onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
            <circle cx={sx(r.prob)} cy={sy(r.impact)} r={radius}
              fill={r.impact > 0 ? "rgba(94,234,212,0.20)" : "rgba(239,96,128,0.20)"}
              stroke={r.impact > 0 ? "var(--good)" : "var(--bad)"} strokeWidth={isHover ? 2 : 1} />
            <text x={sx(r.prob)} y={sy(r.impact) + 4} fontSize={10} textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)">
              {r.id}
            </text>
            {isHover && (
              <text x={sx(r.prob)} y={sy(r.impact) - radius - 6} fontSize={11} textAnchor="middle" fill="var(--ink)">
                {r.name.en}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "good" | "bad" }) {
  return (
    <div>
      <div className="font-mono text-[10px] text-[var(--ink-dim)] uppercase tracking-[0.16em]">{k}</div>
      <div className={`font-mono text-[16px] mt-0.5 ${tone === "bad" ? "text-[var(--bad)]" : tone === "good" ? "text-[var(--good)]" : ""}`}>
        {v}
      </div>
    </div>
  );
}
