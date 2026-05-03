"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { rng32, sampleNormal } from "@/lib/distributions";
import { fmt, pct } from "@/lib/format";
import { Slider } from "./ProbabilityEngine";

type Path = { y: number[]; label: string; tone: "upside" | "baseline" | "downside" | "tail" };

export function ScenarioGenerator() {
  const { lang } = useLang();
  const [start, setStart] = useState(100);
  const [horizon, setHorizon] = useState(24);     // periods
  const [drift, setDrift] = useState(0.6);        // % per period
  const [vol, setVol] = useState(2.5);            // % per period
  const [tail, setTail] = useState(0.04);         // probability of jump per period
  const [seed, setSeed] = useState(42);

  const paths = useMemo(() => generate(start, horizon, drift / 100, vol / 100, tail, seed), [start, horizon, drift, vol, tail, seed]);
  const { lo, mid, hi, p95 } = useMemo(() => fanFromMC(paths.mc), [paths]);

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-8">
      <div>
        <div className="k mb-3">{lang === "zh" ? "情景控制" : "Scenario controls"}</div>
        <div className="space-y-4">
          <Slider label={lang === "zh" ? "起点" : "Start"} value={start} min={20} max={500} step={5} onChange={setStart} />
          <Slider label={lang === "zh" ? "时间步数" : "Periods"} value={horizon} min={6} max={48} step={1} onChange={setHorizon} />
          <Slider label={lang === "zh" ? "漂移 %" : "Drift % / period"} value={drift} min={-3} max={3} step={0.05} onChange={setDrift} />
          <Slider label={lang === "zh" ? "波动率 %" : "Volatility %"} value={vol} min={0.5} max={10} step={0.1} onChange={setVol} />
          <Slider label={lang === "zh" ? "跳跃概率" : "Jump probability"} value={tail} min={0} max={0.2} step={0.005} onChange={setTail} />
          <div className="flex justify-between items-center pt-2">
            <span className="k">{lang === "zh" ? "随机种子" : "Random seed"}</span>
            <button className="btn !py-1" onClick={() => setSeed(Math.floor(Math.random() * 1e6))}>↻ {seed}</button>
          </div>
        </div>

        <div className="k mb-2 mt-8">{lang === "zh" ? "图例" : "Legend"}</div>
        <ul className="space-y-1.5 text-[12px]">
          <li className="flex items-center gap-2"><span className="w-3 h-px bg-[var(--upside)]" />{lang === "zh" ? "乐观（P95）" : "Optimistic (P95)"}</li>
          <li className="flex items-center gap-2"><span className="w-3 h-px bg-[var(--baseline)]" />{lang === "zh" ? "基线（P50）" : "Baseline (P50)"}</li>
          <li className="flex items-center gap-2"><span className="w-3 h-px bg-[var(--downside)]" />{lang === "zh" ? "悲观（P5）" : "Pessimistic (P5)"}</li>
          <li className="flex items-center gap-2"><span className="w-3 h-px bg-[var(--tail)]" />{lang === "zh" ? "极端（含跳跃）" : "Extreme (jump path)"}</li>
        </ul>
      </div>

      <div className="space-y-5">
        <div className="card p-5 dot-bg">
          <div className="flex items-center justify-between mb-2">
            <div className="k">{lang === "zh" ? "扇形图（800 条蒙特卡洛路径）" : "Fan chart · 800 Monte Carlo paths"}</div>
            <div className="font-mono text-[10px] text-[var(--ink-dim)] uppercase tracking-[0.16em]">P5–P95 band</div>
          </div>
          <FanChart paths={paths.scenarios} lo={lo} hi={hi} mid={mid} />
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {paths.scenarios.map((s, i) => (
            <div key={i} className="card p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] mb-1" style={{ color: toneColor(s.tone) }}>{s.label}</div>
              <div className="font-mono text-[18px]">{fmt(s.y[s.y.length - 1], 1)}</div>
              <div className="font-mono text-[11px] text-[var(--ink-dim)] mt-1">
                Δ {((s.y[s.y.length - 1] / start - 1) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <div className="k mb-2">{lang === "zh" ? "终值分布（最后期）" : "Terminal distribution (final period)"}</div>
          <TerminalHistogram values={paths.mc.map(p => p[p.length - 1])} />
          <p className="text-[12px] text-[var(--ink-soft)] mt-3 leading-relaxed">
            {lang === "zh"
              ? `终值 P95 = ${fmt(p95, 1)}，这意味着即便基线显得稳健，也有 5% 路径超过此线。在制定决策时应包括它，而不是回避它。`
              : `Terminal P95 = ${fmt(p95, 1)}. Even when the baseline looks calm, 5% of paths exceed this line. Decisions should be priced including this tail, not against it.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function generate(start: number, horizon: number, drift: number, vol: number, jumpProb: number, seed: number) {
  const N_MC = 800;
  const rng = rng32(seed);
  const mc: number[][] = [];
  for (let i = 0; i < N_MC; i++) {
    const path: number[] = [start];
    for (let t = 0; t < horizon; t++) {
      const last = path[path.length - 1];
      const r = sampleNormal(rng, drift, vol);
      let next = last * (1 + r);
      if (rng() < jumpProb) next *= rng() < 0.5 ? 0.65 : 1.35;
      path.push(next);
    }
    mc.push(path);
  }

  // sort by terminal to pick scenarios
  const sorted = [...mc].sort((a, b) => a[a.length - 1] - b[b.length - 1]);
  const scenarios: Path[] = [
    { y: sorted[Math.floor(0.05 * N_MC)], label: "Pessimistic · P5", tone: "downside" },
    { y: sorted[Math.floor(0.50 * N_MC)], label: "Baseline · P50", tone: "baseline" },
    { y: sorted[Math.floor(0.95 * N_MC)], label: "Optimistic · P95", tone: "upside" },
    { y: sorted[Math.floor(0.99 * N_MC)], label: "Tail · P99", tone: "tail" },
  ];
  return { mc, scenarios };
}

function fanFromMC(mc: number[][]) {
  const len = mc[0].length;
  const lo: number[] = [], hi: number[] = [], mid: number[] = [];
  let p95term = 0;
  for (let t = 0; t < len; t++) {
    const col = mc.map(p => p[t]).sort((a, b) => a - b);
    lo.push(col[Math.floor(0.05 * col.length)]);
    mid.push(col[Math.floor(0.5 * col.length)]);
    hi.push(col[Math.floor(0.95 * col.length)]);
    if (t === len - 1) p95term = col[Math.floor(0.95 * col.length)];
  }
  return { lo, mid, hi, p95: p95term };
}

const FW = 760, FH = 320, FPAD = { l: 36, r: 16, t: 18, b: 26 };

function FanChart({ paths, lo, hi, mid }: { paths: Path[]; lo: number[]; hi: number[]; mid: number[] }) {
  const len = lo.length;
  const allMin = Math.min(...lo, ...paths.map(p => Math.min(...p.y)));
  const allMax = Math.max(...hi, ...paths.map(p => Math.max(...p.y)));
  const sx = (i: number) => FPAD.l + (i / (len - 1)) * (FW - FPAD.l - FPAD.r);
  const sy = (y: number) => FH - FPAD.b - ((y - allMin) / (allMax - allMin || 1)) * (FH - FPAD.t - FPAD.b);

  const band = `M${sx(0)},${sy(lo[0])} ` +
    lo.map((v, i) => `L${sx(i)},${sy(v)}`).join(" ") +
    " " + hi.slice().reverse().map((v, j) => `L${sx(len - 1 - j)},${sy(v)}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${FW} ${FH}`} className="w-full h-auto">
      <defs>
        <linearGradient id="band" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(94,234,212,0.18)" />
          <stop offset="100%" stopColor="rgba(94,234,212,0.04)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <g key={i}>
          <line
            x1={FPAD.l} x2={FW - FPAD.r}
            y1={FPAD.t + f * (FH - FPAD.t - FPAD.b)}
            y2={FPAD.t + f * (FH - FPAD.t - FPAD.b)}
            stroke="var(--line-soft)" strokeDasharray="2 4"
          />
        </g>
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <text
          key={i}
          x={FPAD.l + (i / 8) * (FW - FPAD.l - FPAD.r)}
          y={FH - 8}
          fontSize={10} textAnchor="middle" fill="var(--ink-dim)" fontFamily="var(--font-mono)"
        >
          t{Math.round((i / 8) * (len - 1))}
        </text>
      ))}

      <path d={band} fill="url(#band)" stroke="rgba(94,234,212,0.4)" strokeWidth="0.7" />

      <path d={mid.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`).join(" ")}
        fill="none" stroke="var(--baseline)" strokeWidth="1.4" />

      {paths.map((p, idx) => {
        const stroke = toneColor(p.tone);
        const dash = p.tone === "tail" ? "4 3" : undefined;
        return (
          <path
            key={idx}
            d={p.y.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`).join(" ")}
            fill="none" stroke={stroke} strokeWidth={p.tone === "baseline" ? 2 : 1.4}
            strokeDasharray={dash}
          />
        );
      })}
    </svg>
  );
}

function toneColor(t: Path["tone"]) {
  return t === "upside" ? "var(--upside)"
       : t === "downside" ? "var(--downside)"
       : t === "baseline" ? "var(--baseline)"
       : "var(--tail)";
}

function TerminalHistogram({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const NB = 40;
  const w = (max - min) / NB;
  const bins = new Array(NB).fill(0);
  for (const v of values) {
    const i = Math.min(NB - 1, Math.floor((v - min) / w));
    bins[i]++;
  }
  const ymax = Math.max(...bins);
  const W = 760, H = 160, PAD = { l: 32, r: 16, t: 10, b: 22 };
  const sx = (i: number) => PAD.l + (i / NB) * (W - PAD.l - PAD.r);
  const bw = (W - PAD.l - PAD.r) / NB;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {bins.map((c, i) => {
        const h = (c / ymax) * (H - PAD.t - PAD.b);
        const x = sx(i);
        const xv = min + (i + 0.5) * w;
        // tail tint for upper 5%
        const isTail = xv > min + (max - min) * 0.95;
        return (
          <rect key={i} x={x + 1} y={H - PAD.b - h} width={bw - 2} height={h}
            fill={isTail ? "rgba(182,147,255,0.55)" : "rgba(94,234,212,0.45)"} />
        );
      })}
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--line)" />
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <text key={i} x={PAD.l + f * (W - PAD.l - PAD.r)} y={H - 6} fontSize={10} textAnchor="middle" fill="var(--ink-dim)" fontFamily="var(--font-mono)">
          {fmt(min + f * (max - min), 0)}
        </text>
      ))}
    </svg>
  );
}
