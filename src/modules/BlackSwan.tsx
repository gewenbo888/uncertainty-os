"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { linspace, normalPdf, paretoPdf, paretoSurvival } from "@/lib/distributions";
import { fmt, pct } from "@/lib/format";
import { Slider } from "./ProbabilityEngine";

const W = 760, H = 320, PAD = { l: 50, r: 16, t: 18, b: 28 };

export function BlackSwanDetector() {
  const { lang } = useLang();
  const [alpha, setAlpha] = useState(1.4);   // tail index
  const [xm, setXm] = useState(20);          // pareto scale
  const [normalSd, setNormalSd] = useState(15);
  const [normalMean] = useState(50);
  const [scenarioSize, setScenarioSize] = useState(100);

  const xs = useMemo(() => linspace(1, 200, 400), []);
  const yNormal = useMemo(() => xs.map(x => normalPdf(x, normalMean, normalSd)), [xs, normalSd, normalMean]);
  const yPareto = useMemo(() => xs.map(x => paretoPdf(x, xm, alpha)), [xs, xm, alpha]);

  // Compute survival probabilities at the chosen scenario size
  const survN = 1 - cdfNormal(scenarioSize, normalMean, normalSd);
  const survP = paretoSurvival(scenarioSize, xm, alpha);
  const ratio = survP / Math.max(survN, 1e-10);

  // Domination demo: small probability × large impact
  const eventProb = 0.01;
  const eventImpact = 100;
  const baselineImpact = 5;

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-8">
      <div>
        <div className="k mb-3">{lang === "zh" ? "尾部参数" : "Tail parameters"}</div>
        <div className="space-y-4">
          <Slider label={lang === "zh" ? "正态 σ" : "Normal σ"} value={normalSd} min={5} max={40} step={0.5} onChange={setNormalSd} />
          <Slider label={lang === "zh" ? "幂律 α（越小尾越肥）" : "Pareto α (smaller = fatter tail)"} value={alpha} min={1.1} max={3.5} step={0.05} onChange={setAlpha} />
          <Slider label={lang === "zh" ? "幂律起点 xₘ" : "Pareto scale xₘ"} value={xm} min={5} max={60} step={1} onChange={setXm} />
          <Slider label={lang === "zh" ? "情景规模 X*" : "Event size X*"} value={scenarioSize} min={50} max={200} step={1} onChange={setScenarioSize} />
        </div>

        <div className="card p-4 mt-7">
          <div className="k mb-2">{lang === "zh" ? "P(X > X*)" : "P(X > X*)"}</div>
          <div className="text-[12px] space-y-1.5 font-mono">
            <div className="flex justify-between"><span className="text-[var(--ink-dim)]">Normal</span><span>{pct(survN, 4)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--ink-dim)]">Pareto</span><span className="text-[var(--tail)]">{pct(survP, 4)}</span></div>
            <div className="h-px my-2 bg-[var(--line)]" />
            <div className="flex justify-between">
              <span className="text-[var(--ink-dim)]">{lang === "zh" ? "比值" : "ratio"}</span>
              <span className="text-[var(--tail)]">{ratio < 1e3 ? `${ratio.toFixed(1)}×` : ratio.toExponential(1)}</span>
            </div>
          </div>
          <p className="text-[11px] text-[var(--ink-soft)] mt-3 leading-relaxed">
            {lang === "zh"
              ? "在重尾下，「极少发生的事件」并不真的极少。"
              : "Under fat tails, what looks 'almost never' isn't."}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="card p-5 dot-bg">
          <div className="flex items-center justify-between mb-2">
            <div className="k">{lang === "zh" ? "尾部叠加：正态 vs 幂律" : "Tail overlay: Normal vs Pareto"}</div>
            <div className="font-mono text-[10px] text-[var(--ink-dim)] uppercase tracking-[0.16em]">log y-axis</div>
          </div>
          <TailChart xs={xs} yN={yNormal} yP={yPareto} scenario={scenarioSize} />
        </div>

        <div className="card p-5">
          <div className="k mb-3">{lang === "zh" ? "小概率 × 大影响：谁主导期望值？" : "Small probability × large impact: who dominates EV?"}</div>
          <DominanceBar probTail={eventProb} valueTail={eventImpact} probBase={1 - eventProb} valueBase={baselineImpact} lang={lang} />
          <p className="text-[12px] text-[var(--ink-soft)] mt-3 leading-relaxed">
            {lang === "zh"
              ? `1% 概率 × 100 单位影响 = 1.0 期望贡献。\n99% × 5 = 4.95。两者数量级接近。即使 0.1% × 1000 = 1.0——「极小概率」从未消失。`
              : `1% × 100-impact = 1.0 EV.\n99% × 5 = 4.95. Same order of magnitude. Even 0.1% × 1000 = 1.0 — the 'almost-never' never goes away.`}
          </p>
        </div>

        <div className="card p-5">
          <div className="k mb-3">{lang === "zh" ? "黑天鹅判别清单" : "Black-swan checklist"}</div>
          <ul className="space-y-2 text-[13px]">
            {[
              { en: "Outcome distribution looks compressed but spans orders of magnitude.", zh: "结果分布看似集中，但跨多个数量级。" },
              { en: "A single observation could move your estimate by ≥ 50%.", zh: "单一观测能让估计变动 ≥ 50%。" },
              { en: "Past samples come from a calm regime; current process may not.", zh: "历史样本来自平静期；当前过程可能不属于同一机制。" },
              { en: "Variance is dominated by the largest single observation.", zh: "方差被最大单一观测主导。" },
              { en: "Domain has positive feedback (success creates exposure).", zh: "领域存在正反馈（成功本身扩大暴露）。" },
            ].map((c, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-[var(--tail)] font-mono text-[11px] mt-0.5">[{i + 1}]</span>
                <span className="text-[var(--ink-soft)]">{lang === "zh" ? c.zh : c.en}</span>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-[var(--ink)] mt-4 italic font-serif border-l-2 border-[var(--tail)] pl-4">
            {lang === "zh"
              ? "三条以上勾选 → 你不在「正态世界」。请把决策结构改为对尾部稳健（杠铃、止损、可逆性）。"
              : "Three or more ticks → you are not in normal-world. Restructure decisions to be tail-robust: barbells, hard stops, reversibility."}
          </p>
        </div>
      </div>
    </div>
  );
}

function cdfNormal(x: number, mean: number, sd: number) {
  const z = (x - mean) / sd;
  return 0.5 * (1 + erf(z / Math.SQRT2));
}
function erf(x: number) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1.0 / (1.0 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t * Math.exp(-ax * ax) -
    0.254829592 * t * Math.exp(-ax * ax);
  return sign * y;
}

function TailChart({ xs, yN, yP, scenario }: { xs: number[]; yN: number[]; yP: number[]; scenario: number }) {
  const xmin = xs[0], xmax = xs[xs.length - 1];
  const yMaxLog = Math.log10(Math.max(...yN, ...yP, 0.001));
  const yMinLog = -10;
  const sx = (x: number) => PAD.l + ((x - xmin) / (xmax - xmin)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => {
    if (y <= 0) return H - PAD.b;
    const ly = Math.log10(y);
    return H - PAD.b - ((ly - yMinLog) / (yMaxLog - yMinLog)) * (H - PAD.t - PAD.b);
  };

  const pathN = yN.map((y, i) => `${i === 0 ? "M" : "L"}${sx(xs[i]).toFixed(2)},${sy(y).toFixed(2)}`).join(" ");
  const pathP = yP.map((y, i) => `${i === 0 ? "M" : "L"}${sx(xs[i]).toFixed(2)},${sy(y).toFixed(2)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[-9, -7, -5, -3, -1].map(p => (
        <g key={p}>
          <line x1={PAD.l} y1={sy(Math.pow(10, p))} x2={W - PAD.r} y2={sy(Math.pow(10, p))}
                stroke="var(--line-soft)" strokeDasharray="2 4" />
          <text x={PAD.l - 8} y={sy(Math.pow(10, p)) + 3} fontSize={9} textAnchor="end" fill="var(--ink-dim)" fontFamily="var(--font-mono)">10^{p}</text>
        </g>
      ))}
      {[0, 50, 100, 150, 200].map(v => (
        <g key={v}>
          <line x1={sx(v)} y1={PAD.t} x2={sx(v)} y2={H - PAD.b} stroke="var(--line-soft)" strokeDasharray="2 4" />
          <text x={sx(v)} y={H - 8} fontSize={10} textAnchor="middle" fill="var(--ink-dim)" fontFamily="var(--font-mono)">{v}</text>
        </g>
      ))}
      <path d={pathN} fill="none" stroke="var(--baseline)" strokeWidth="1.5" />
      <path d={pathP} fill="none" stroke="var(--tail)" strokeWidth="1.5" />

      <line x1={sx(scenario)} y1={PAD.t} x2={sx(scenario)} y2={H - PAD.b} stroke="var(--accent)" strokeDasharray="3 3" />
      <text x={sx(scenario)} y={PAD.t + 12} fontSize={10} textAnchor="middle" fill="var(--accent)" fontFamily="var(--font-mono)">X*= {scenario}</text>

      <g fontFamily="var(--font-mono)" fontSize={11}>
        <rect x={W - 180} y={PAD.t} width={150} height={42} fill="rgba(11,12,16,0.85)" stroke="var(--line)" />
        <line x1={W - 170} y1={PAD.t + 14} x2={W - 150} y2={PAD.t + 14} stroke="var(--baseline)" strokeWidth="2" />
        <text x={W - 144} y={PAD.t + 18} fill="var(--ink-soft)">Normal</text>
        <line x1={W - 170} y1={PAD.t + 30} x2={W - 150} y2={PAD.t + 30} stroke="var(--tail)" strokeWidth="2" />
        <text x={W - 144} y={PAD.t + 34} fill="var(--ink-soft)">Pareto (fat tail)</text>
      </g>
    </svg>
  );
}

function DominanceBar({ probTail, valueTail, probBase, valueBase, lang }: { probTail: number; valueTail: number; probBase: number; valueBase: number; lang: "en" | "zh" }) {
  const evTail = probTail * valueTail;
  const evBase = probBase * valueBase;
  const total = evTail + evBase;
  const tailFrac = evTail / total;
  return (
    <div>
      <div className="flex h-8 border border-[var(--line)] overflow-hidden">
        <div className="bg-[var(--baseline)] flex items-center justify-center font-mono text-[11px] text-[#062018]"
             style={{ width: `${(1 - tailFrac) * 100}%` }}>
          {(probBase * 100).toFixed(0)}% × {valueBase} = {evBase.toFixed(2)}
        </div>
        <div className="bg-[var(--tail)] flex items-center justify-center font-mono text-[11px] text-[#0c0815]"
             style={{ width: `${tailFrac * 100}%` }}>
          {(probTail * 100).toFixed(1)}% × {valueTail} = {evTail.toFixed(2)}
        </div>
      </div>
      <div className="font-mono text-[10px] text-[var(--ink-dim)] uppercase tracking-[0.16em] mt-1 flex justify-between">
        <span>{lang === "zh" ? "正常区收益" : "everyday gain"}</span>
        <span>{lang === "zh" ? "尾部贡献" : "tail contribution"}</span>
      </div>
    </div>
  );
}
