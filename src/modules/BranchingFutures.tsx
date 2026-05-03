"use client";
import { useMemo, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { fmt, pct } from "@/lib/format";

type Node = {
  id: string;
  label: { en: string; zh: string };
  prob: number;
  value: number;
  parent: string | null;
  depth: number;
};

const TREE_SEED: Node[] = [
  { id: "root", label: { en: "Start", zh: "起点" }, prob: 1, value: 100, parent: null, depth: 0 },
  { id: "A", label: { en: "Strong growth", zh: "强劲增长" }, prob: 0.30, value: 180, parent: "root", depth: 1 },
  { id: "B", label: { en: "Moderate growth", zh: "温和增长" }, prob: 0.45, value: 115, parent: "root", depth: 1 },
  { id: "C", label: { en: "Stagnation", zh: "停滞" }, prob: 0.18, value: 90, parent: "root", depth: 1 },
  { id: "D", label: { en: "Crisis / tail", zh: "危机 / 尾部" }, prob: 0.07, value: 40, parent: "root", depth: 1 },

  { id: "A1", label: { en: "Sustained", zh: "持续" }, prob: 0.55, value: 230, parent: "A", depth: 2 },
  { id: "A2", label: { en: "Mean-reverts", zh: "均值回归" }, prob: 0.45, value: 140, parent: "A", depth: 2 },

  { id: "B1", label: { en: "Accelerates", zh: "加速" }, prob: 0.35, value: 155, parent: "B", depth: 2 },
  { id: "B2", label: { en: "Holds steady", zh: "维持稳定" }, prob: 0.40, value: 110, parent: "B", depth: 2 },
  { id: "B3", label: { en: "Decelerates", zh: "减速" }, prob: 0.25, value: 80, parent: "B", depth: 2 },

  { id: "C1", label: { en: "Recovers slowly", zh: "缓慢恢复" }, prob: 0.60, value: 105, parent: "C", depth: 2 },
  { id: "C2", label: { en: "Worsens", zh: "恶化" }, prob: 0.40, value: 65, parent: "C", depth: 2 },

  { id: "D1", label: { en: "Contained", zh: "受控" }, prob: 0.45, value: 55, parent: "D", depth: 2 },
  { id: "D2", label: { en: "Cascades", zh: "级联崩溃" }, prob: 0.55, value: 20, parent: "D", depth: 2 },
];

function getPathProb(nodeId: string, nodes: Node[]): number {
  const node = nodes.find(n => n.id === nodeId)!;
  if (!node.parent) return node.prob;
  const parent = nodes.find(n => n.id === node.parent)!;
  return node.prob * getPathProb(parent.id, nodes);
}

export function BranchingFutures() {
  const { lang, B } = useLang();
  const [hovered, setHovered] = useState<string | null>(null);

  const nodes = TREE_SEED;

  const leaves = nodes.filter(n => !nodes.some(m => m.parent === n.id));
  const ev = leaves.reduce((s, n) => s + getPathProb(n.id, nodes) * n.value, 0);
  const worstLeaf = leaves.reduce((a, b) => getPathProb(a.id, nodes) * a.value < getPathProb(b.id, nodes) * b.value ? a : b);
  const bestLeaf = leaves.reduce((a, b) => getPathProb(a.id, nodes) * a.value > getPathProb(b.id, nodes) * b.value ? a : b);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label={{ en: "Expected value", zh: "期望值" }} value={`${fmt(ev, 1)}`} tone="neutral" lang={lang} />
        <StatCard label={{ en: "Worst-EV leaf", zh: "最差 EV 路径" }} value={`${fmt(getPathProb(worstLeaf.id, nodes) * worstLeaf.value, 2)}`} sub={B(worstLeaf.label)} tone="bad" lang={lang} />
        <StatCard label={{ en: "Best-EV leaf", zh: "最优 EV 路径" }} value={`${fmt(getPathProb(bestLeaf.id, nodes) * bestLeaf.value, 2)}`} sub={B(bestLeaf.label)} tone="good" lang={lang} />
      </div>

      <div className="card p-5 dot-bg overflow-x-auto">
        <div className="k mb-3">{lang === "zh" ? "决策树 — 概率 × 价值" : "Decision tree — probability × value"}</div>
        <TreeViz nodes={nodes} hovered={hovered} setHovered={setHovered} lang={lang} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="k mb-3">{lang === "zh" ? "叶节点期望贡献" : "Leaf EV contributions"}</div>
          <div className="space-y-2">
            {leaves.sort((a, b) => getPathProb(b.id, nodes) * b.value - getPathProb(a.id, nodes) * a.value).map(n => {
              const ep = getPathProb(n.id, nodes);
              const ev_n = ep * n.value;
              const barW = Math.min(100, (ev_n / 70) * 100);
              return (
                <div key={n.id}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`p-3 border text-[12px] transition-all cursor-pointer ${hovered === n.id ? "border-[var(--accent)]" : "border-[var(--line)]"}`}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{B(n.label)}</span>
                    <span className="font-mono text-[var(--accent)]">{fmt(ev_n, 2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--ink-dim)] font-mono uppercase tracking-[0.16em] mb-2">
                    <span>{lang === "zh" ? "路径概率" : "path p"} {pct(ep, 2)}</span>
                    <span>{lang === "zh" ? "终值" : "terminal"} {fmt(n.value, 0)}</span>
                  </div>
                  <div className="h-1 bg-[var(--bg-elev-2)]">
                    <div className="h-full bg-[var(--accent)] opacity-70" style={{ width: `${barW}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="k mb-3">{lang === "zh" ? "分支未来的核心洞见" : "Core insights from branching futures"}</div>
          <ul className="space-y-3 text-[13px]">
            {[
              { en: "The expected value is NOT the most likely path — it is the probability-weighted average across all branches.", zh: "期望值不是最可能的路径——它是所有分支的概率加权平均。" },
              { en: "A low-probability catastrophe (7% crisis → cascade: 0.07 × 0.55 = 3.9%) can contribute more EV damage than a 25% ordinary downside.", zh: "低概率灾难（7% 危机 → 级联：0.07 × 0.55 = 3.9%）造成的期望损失可超过 25% 的普通下行。" },
              { en: "Decisions at fork points are irreversible — the value of information is highest before you commit to a branch.", zh: "分叉点的决策是不可逆的——信息价值在承诺分支前最高。" },
              { en: "Pruning tail branches (investing in resilience) has nonlinear payoffs: cutting 3.9% → 0% raises EV by more than its probability suggests.", zh: "剪除尾部分支（投资韧性）具有非线性收益：将 3.9% 降至 0% 对期望值的提升超过其概率所暗示的程度。" },
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-[var(--accent)] font-mono text-[11px] mt-0.5">[{i + 1}]</span>
                <span className="text-[var(--ink-soft)] leading-relaxed">{lang === "zh" ? item.zh : item.en}</span>
              </li>
            ))}
          </ul>
          <p className="text-[12px] italic font-serif text-[var(--ink)] border-l-2 border-[var(--accent)] pl-4 mt-5 leading-relaxed">
            {lang === "zh"
              ? "「真正的不确定性」在于：你无法看见完整的树——你只能从一个节点向前看一两步。建立分支模型迫使你量化「你不知道什么」。"
              : "True uncertainty is that you cannot see the full tree — you can only look one or two steps forward from where you are. Building the branching model forces you to quantify what you don't know."}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, tone, lang }: { label: { en: string; zh: string }; value: string; sub?: string; tone: "good" | "bad" | "neutral"; lang: "en" | "zh" }) {
  const color = tone === "good" ? "var(--good)" : tone === "bad" ? "var(--bad)" : "var(--accent)";
  return (
    <div className="card p-4">
      <div className="k mb-1">{label[lang]}</div>
      <div className="font-mono text-[22px]" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--ink-dim)] mt-1 truncate">{sub}</div>}
    </div>
  );
}

const TW = 900, TH = 420;

function TreeViz({ nodes, hovered, setHovered, lang }: {
  nodes: Node[];
  hovered: string | null;
  setHovered: (id: string | null) => void;
  lang: "en" | "zh";
}) {
  const positions = useMemo(() => computePositions(nodes, TW, TH), [nodes]);

  return (
    <svg viewBox={`0 0 ${TW} ${TH}`} className="w-full h-auto min-w-[600px]">
      {nodes.map(n => {
        if (!n.parent) return null;
        const from = positions[n.parent];
        const to = positions[n.id];
        if (!from || !to) return null;
        const pathProb = getPathProb(n.id, nodes);
        const strokeW = 1 + pathProb * 10;
        const isHov = hovered === n.id || hovered === n.parent;
        return (
          <line key={`e-${n.id}`}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={isHov ? "var(--accent)" : "var(--line)"}
            strokeWidth={isHov ? strokeW + 0.5 : strokeW}
            strokeOpacity={isHov ? 1 : 0.55}
          />
        );
      })}

      {nodes.map(n => {
        const pos = positions[n.id];
        if (!pos) return null;
        const pathProb = getPathProb(n.id, nodes);
        const isLeaf = !nodes.some(m => m.parent === n.id);
        const isHov = hovered === n.id;
        const r = n.depth === 0 ? 14 : isLeaf ? 10 : 8;
        const fillColor = n.value >= 100 ? "rgba(94,234,212,0.25)" : n.value >= 60 ? "rgba(240,198,116,0.2)" : "rgba(239,96,128,0.25)";
        const strokeColor = n.value >= 100 ? "var(--good)" : n.value >= 60 ? "var(--warn)" : "var(--bad)";

        return (
          <g key={n.id}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}>
            <circle cx={pos.x} cy={pos.y} r={isHov ? r + 3 : r}
              fill={isHov ? "rgba(94,234,212,0.35)" : fillColor}
              stroke={isHov ? "var(--accent)" : strokeColor}
              strokeWidth={isHov ? 2 : 1} />
            <text x={pos.x} y={pos.y + 3} fontSize={isLeaf ? 9 : 10}
              textAnchor="middle" fill={isHov ? "var(--ink)" : "var(--ink-soft)"}
              fontFamily="var(--font-mono)">{fmt(n.value, 0)}</text>
            {(isLeaf || n.depth === 0 || isHov) && (
              <text x={pos.x} y={pos.y - r - 5} fontSize={9}
                textAnchor="middle" fill={isHov ? "var(--accent)" : "var(--ink-dim)"}
                fontFamily="var(--font-mono)">
                {isLeaf ? pct(pathProb, 1) : n.depth === 0 ? (lang === "zh" ? "起点" : "start") : pct(n.prob, 0)}
              </text>
            )}
            {isHov && (
              <text x={pos.x} y={pos.y + r + 14} fontSize={10}
                textAnchor="middle" fill="var(--ink)"
                fontFamily="var(--font-mono)">{n.label[lang]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function computePositions(nodes: Node[], W: number, H: number): Record<string, { x: number; y: number }> {
  const depths = [0, 1, 2];
  const padX = 60, padY = 40;
  const usableH = H - padY * 2;

  const byDepth: Record<number, Node[]> = {};
  for (const n of nodes) {
    if (!byDepth[n.depth]) byDepth[n.depth] = [];
    byDepth[n.depth].push(n);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  const xStep = (W - padX * 2) / (depths.length - 1);

  for (const depth of depths) {
    const group = byDepth[depth] ?? [];
    const x = padX + depth * xStep;
    group.forEach((n, i) => {
      const y = group.length === 1
        ? H / 2
        : padY + (i / (group.length - 1)) * usableH;
      positions[n.id] = { x, y };
    });
  }

  return positions;
}
