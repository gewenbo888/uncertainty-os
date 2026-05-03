"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { cdf, type DistParams, linspace, pdf, statsFromGrid } from "@/lib/distributions";
import { fmt, pct } from "@/lib/format";

type Kind = DistParams["kind"];

const KINDS: { id: Kind; en: string; zh: string; note: { en: string; zh: string } }[] = [
  { id: "normal", en: "Normal", zh: "正态", note: { en: "Symmetric, no tail.", zh: "对称，无重尾。" } },
  { id: "lognormal", en: "Log-normal", zh: "对数正态", note: { en: "Right-skewed; familiar in incomes, latencies.", zh: "右偏；常见于收入、延迟。" } },
  { id: "triangular", en: "Triangular", zh: "三角分布", note: { en: "When you only know min, mode, max.", zh: "只知最小、众数、最大值时使用。" } },
  { id: "mixture", en: "Mixture", zh: "混合分布", note: { en: "Two regimes — common in real life.", zh: "双机制——现实常见。" } },
];

const DEFAULTS: Record<Kind, DistParams> = {
  normal: { kind: "normal", mean: 100, sd: 15 },
  lognormal: { kind: "lognormal", mu: 4.6, sigma: 0.45 },
  triangular: { kind: "triangular", min: 60, mode: 95, max: 180 },
  mixture: { kind: "mixture", a: { kind: "normal", mean: 90, sd: 10 }, b: { kind: "normal", mean: 150, sd: 30 }, weight: 0.7 },
};

export function ProbabilityEngine() {
  const { B, lang } = useLang();
  const [kind, setKind] = useState<Kind>("normal");
  const [params, setParams] = useState<DistParams>(DEFAULTS["normal"]);

  function pickKind(k: Kind) {
    setKind(k);
    setParams(DEFAULTS[k]);
  }

  const xs = useMemo(() => linspace(0, 280, 280), []);
  const ys = useMemo(() => xs.map(x => pdf(x, params)), [xs, params]);
  const stats = useMemo(() => statsFromGrid(params, xs), [params, xs]);

  return (
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-8">
      <div>
        <div className="k mb-3">{lang === "zh" ? "分布族" : "Distribution family"}</div>
        <div className="space-y-1.5 mb-6">
          {KINDS.map(k => (
            <button
              key={k.id}
              onClick={() => pickKind(k.id)}
              className={`w-full text-left p-3 border transition-all
                ${kind === k.id ? "border-[var(--accent)] bg-[rgba(94,234,212,0.06)]" : "border-[var(--line)] hover:border-[#2c3545]"}`}
            >
              <div className="text-[14px] font-medium">{lang === "zh" ? k.zh : k.en}</div>
              <div className="text-[11px] text-[var(--ink-soft)] mt-1 italic font-serif">{B(k.note)}</div>
            </button>
          ))}
        </div>

        <ParamSliders kind={kind} params={params} onChange={setParams} lang={lang} />
      </div>

      <div className="space-y-5">
        <div className="card p-5 dot-bg">
          <div className="flex items-center justify-between mb-2">
            <div className="k">{lang === "zh" ? "概率密度" : "Probability density"}</div>
            <div className="font-mono text-[10px] text-[var(--ink-dim)] uppercase tracking-[0.16em]">PDF · 0 → 280</div>
          </div>
          <PDFView xs={xs} ys={ys} params={params} stats={stats} />
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="k">{lang === "zh" ? "累积分布" : "Cumulative"}</div>
            <div className="font-mono text-[10px] text-[var(--ink-dim)] uppercase tracking-[0.16em]">CDF</div>
          </div>
          <CDFView xs={xs} params={params} stats={stats} />
        </div>

        <StatsTable stats={stats} lang={lang} />

        <div className="card p-6">
          <div className="k mb-2">{lang === "zh" ? "为什么这些事重要" : "Why this matters"}</div>
          <p className="text-[14px] text-[var(--ink-soft)] leading-relaxed">
            {lang === "zh"
              ? "点估计要求你假装确定。分布让你显式承认：当下知道范围、形状与不对称，远比假装一个数字更可靠。如果决策仅依赖均值，则任何尾部事件都会让你措手不及。"
              : "A point estimate forces you to pretend certainty. A distribution lets you say what you actually know — the range, the shape, the asymmetry. If a decision depends only on the mean, every tail event will surprise you."}
          </p>
        </div>
      </div>
    </div>
  );
}

function ParamSliders({ kind, params, onChange, lang }: { kind: Kind; params: DistParams; onChange: (p: DistParams) => void; lang: "en" | "zh" }) {
  if (kind === "normal" && params.kind === "normal") {
    return (
      <div className="space-y-4">
        <Slider label={lang === "zh" ? "均值 μ" : "Mean μ"} value={params.mean} min={20} max={250} step={1}
          onChange={v => onChange({ ...params, mean: v })} />
        <Slider label={lang === "zh" ? "标准差 σ" : "Std-dev σ"} value={params.sd} min={3} max={80} step={0.5}
          onChange={v => onChange({ ...params, sd: v })} />
      </div>
    );
  }
  if (kind === "lognormal" && params.kind === "lognormal") {
    return (
      <div className="space-y-4">
        <Slider label={lang === "zh" ? "对数均值 μ" : "Log-mean μ"} value={params.mu} min={2} max={6} step={0.05}
          onChange={v => onChange({ ...params, mu: v })} />
        <Slider label={lang === "zh" ? "形状 σ" : "Shape σ"} value={params.sigma} min={0.1} max={1.4} step={0.02}
          onChange={v => onChange({ ...params, sigma: v })} />
      </div>
    );
  }
  if (kind === "triangular" && params.kind === "triangular") {
    return (
      <div className="space-y-4">
        <Slider label={lang === "zh" ? "最小" : "Min"} value={params.min} min={0} max={params.mode - 1} step={1}
          onChange={v => onChange({ ...params, min: v })} />
        <Slider label={lang === "zh" ? "众数" : "Mode"} value={params.mode} min={params.min + 1} max={params.max - 1} step={1}
          onChange={v => onChange({ ...params, mode: v })} />
        <Slider label={lang === "zh" ? "最大" : "Max"} value={params.max} min={params.mode + 1} max={280} step={1}
          onChange={v => onChange({ ...params, max: v })} />
      </div>
    );
  }
  if (kind === "mixture" && params.kind === "mixture") {
    return (
      <div className="space-y-4">
        <Slider label={lang === "zh" ? "成分 A 均值" : "A mean"} value={params.a.mean} min={20} max={250} step={1}
          onChange={v => onChange({ ...params, a: { ...params.a, mean: v } })} />
        <Slider label={lang === "zh" ? "A σ" : "A σ"} value={params.a.sd} min={3} max={50} step={0.5}
          onChange={v => onChange({ ...params, a: { ...params.a, sd: v } })} />
        <Slider label={lang === "zh" ? "成分 B 均值" : "B mean"} value={params.b.mean} min={20} max={260} step={1}
          onChange={v => onChange({ ...params, b: { ...params.b, mean: v } })} />
        <Slider label={lang === "zh" ? "B σ" : "B σ"} value={params.b.sd} min={3} max={80} step={0.5}
          onChange={v => onChange({ ...params, b: { ...params.b, sd: v } })} />
        <Slider label={lang === "zh" ? "A 权重" : "Weight on A"} value={params.weight} min={0.05} max={0.95} step={0.01}
          onChange={v => onChange({ ...params, weight: v })} />
      </div>
    );
  }
  return null;
}

export function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="k">{label}</span>
        <span className="font-mono text-[11px] text-[var(--ink)]">{fmt(value, step < 1 ? 2 : 0)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

const W = 720, H = 320, PAD = { l: 40, r: 20, t: 20, b: 28 };

function PDFView({ xs, ys, params, stats }: { xs: number[]; ys: number[]; params: DistParams; stats: ReturnType<typeof statsFromGrid> }) {
  const ymax = Math.max(...ys, 0.001);
  const xmin = xs[0], xmax = xs[xs.length - 1];
  const sx = (x: number) => PAD.l + ((x - xmin) / (xmax - xmin)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - (y / ymax) * (H - PAD.t - PAD.b);

  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${sx(x).toFixed(2)},${sy(ys[i]).toFixed(2)}`).join(" ");
  const fill = `${path} L${sx(xmax).toFixed(2)},${sy(0).toFixed(2)} L${sx(xmin).toFixed(2)},${sy(0).toFixed(2)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="pdf-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(94,234,212,0.42)" />
          <stop offset="100%" stopColor="rgba(94,234,212,0.04)" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {linspace(xmin, xmax, 8).map((x, i) => (
        <g key={i}>
          <line x1={sx(x)} y1={PAD.t} x2={sx(x)} y2={H - PAD.b} stroke="var(--line-soft)" strokeDasharray="2 4" />
          <text x={sx(x)} y={H - 8} fontSize={10} textAnchor="middle" fill="var(--ink-dim)" fontFamily="var(--font-mono)">{x.toFixed(0)}</text>
        </g>
      ))}
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--line)" />

      <path d={fill} fill="url(#pdf-fill)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.6" />

      {/* mean / median markers */}
      <line x1={sx(stats.mean)} y1={PAD.t} x2={sx(stats.mean)} y2={H - PAD.b} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" />
      <text x={sx(stats.mean)} y={PAD.t + 12} fontSize={10} textAnchor="middle" fill="var(--accent)" fontFamily="var(--font-mono)">μ {fmt(stats.mean, 1)}</text>

      <line x1={sx(stats.p05)} y1={PAD.t} x2={sx(stats.p05)} y2={H - PAD.b} stroke="var(--bad)" strokeWidth="1" strokeDasharray="2 4" />
      <line x1={sx(stats.p95)} y1={PAD.t} x2={sx(stats.p95)} y2={H - PAD.b} stroke="var(--bad)" strokeWidth="1" strokeDasharray="2 4" />
      <text x={sx(stats.p05)} y={H - PAD.b - 6} fontSize={10} textAnchor="middle" fill="var(--bad)" fontFamily="var(--font-mono)">P5</text>
      <text x={sx(stats.p95)} y={H - PAD.b - 6} fontSize={10} textAnchor="middle" fill="var(--bad)" fontFamily="var(--font-mono)">P95</text>
    </svg>
  );
}

function CDFView({ xs, params, stats }: { xs: number[]; params: DistParams; stats: ReturnType<typeof statsFromGrid> }) {
  const xmin = xs[0], xmax = xs[xs.length - 1];
  const sx = (x: number) => PAD.l + ((x - xmin) / (xmax - xmin)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - y * (H - PAD.t - PAD.b);

  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${sx(x).toFixed(2)},${sy(cdf(x, params)).toFixed(2)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {[0.25, 0.5, 0.75].map(y => (
        <g key={y}>
          <line x1={PAD.l} y1={sy(y)} x2={W - PAD.r} y2={sy(y)} stroke="var(--line-soft)" strokeDasharray="2 4" />
          <text x={PAD.l - 8} y={sy(y) + 3} fontSize={10} textAnchor="end" fill="var(--ink-dim)" fontFamily="var(--font-mono)">{y.toFixed(2)}</text>
        </g>
      ))}
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--line)" />
      <path d={path} fill="none" stroke="var(--baseline)" strokeWidth="1.6" />
      {/* quantile markers */}
      {[
        { v: stats.p05, label: "P5" },
        { v: stats.median, label: "P50" },
        { v: stats.p95, label: "P95" },
      ].map(({ v, label }, i) => (
        <g key={i}>
          <circle cx={sx(v)} cy={sy(cdf(v, params))} r={3} fill="var(--accent)" />
          <text x={sx(v)} y={sy(cdf(v, params)) - 8} fontSize={10} textAnchor="middle" fill="var(--ink-soft)" fontFamily="var(--font-mono)">{label} · {fmt(v, 0)}</text>
        </g>
      ))}
    </svg>
  );
}

function StatsTable({ stats, lang }: { stats: ReturnType<typeof statsFromGrid>; lang: "en" | "zh" }) {
  const rows = [
    { k: lang === "zh" ? "均值" : "Mean", v: fmt(stats.mean, 1) },
    { k: lang === "zh" ? "标准差" : "Std-dev", v: fmt(stats.std, 2) },
    { k: lang === "zh" ? "中位数" : "Median", v: fmt(stats.median, 1) },
    { k: "P5",  v: fmt(stats.p05, 1) },
    { k: "P25", v: fmt(stats.p25, 1) },
    { k: "P75", v: fmt(stats.p75, 1) },
    { k: "P95", v: fmt(stats.p95, 1) },
    { k: "P99", v: fmt(stats.p99, 1) },
    { k: lang === "zh" ? "偏度" : "Skew", v: fmt(stats.skew, 2) },
    { k: lang === "zh" ? "尾概率 (>2σ)" : "Tail prob (>2σ)", v: pct(stats.tailProb, 1) },
  ];
  return (
    <div className="card p-5">
      <div className="k mb-3">{lang === "zh" ? "分布特征" : "Distribution stats"}</div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3">
        {rows.map(r => (
          <div key={r.k}>
            <div className="font-mono text-[10px] text-[var(--ink-dim)] uppercase tracking-[0.16em]">{r.k}</div>
            <div className="font-mono text-[15px] text-[var(--ink)] mt-0.5">{r.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
