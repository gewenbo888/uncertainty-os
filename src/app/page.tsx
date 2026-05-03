"use client";
import { useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { ui } from "@/i18n/dict";
import { ProbabilityEngine } from "@/modules/ProbabilityEngine";
import { ScenarioGenerator } from "@/modules/ScenarioGenerator";
import { RiskMap } from "@/modules/RiskMap";
import { DecisionUnderUncertainty } from "@/modules/DecisionUnderUncertainty";
import { BlackSwanDetector } from "@/modules/BlackSwan";
import { BranchingFutures } from "@/modules/BranchingFutures";
import { RiskAnalyst } from "@/modules/RiskAnalyst";

type Tab = "overview" | "engine" | "scenarios" | "risk" | "decision" | "blackswan" | "branching" | "analyst";

const TABS: { id: Tab; labelKey: keyof typeof ui }[] = [
  { id: "overview", labelKey: "nav_overview" },
  { id: "engine", labelKey: "nav_engine" },
  { id: "scenarios", labelKey: "nav_scenarios" },
  { id: "risk", labelKey: "nav_risk" },
  { id: "decision", labelKey: "nav_decision" },
  { id: "blackswan", labelKey: "nav_blackswan" },
  { id: "branching", labelKey: "nav_branching" },
  { id: "analyst",  labelKey: "nav_analyst" },
];

export default function Home() {
  const { T, lang, toggle } = useLang();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-[var(--bg)] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <button onClick={() => setTab("overview")} className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">Ω</span>
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--ink)]">
              {T("brand")}
            </span>
          </button>

          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 justify-center">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.15em] whitespace-nowrap transition-all rounded-[2px]
                  ${tab === t.id
                    ? "bg-[var(--bg-elev-2)] text-[var(--accent)] border border-[var(--accent)] border-opacity-40"
                    : "text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}>
                {T(t.labelKey)}
              </button>
            ))}
          </nav>

          <button
            onClick={toggle}
            className="btn !py-1 !px-3 font-mono text-[11px] tracking-[0.15em] shrink-0">
            {lang === "en" ? "中文" : "EN"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-10">
        {tab === "overview" && <Overview onNavigate={setTab} />}
        {tab === "engine" && <Section title={T("nav_engine")} sub={lang === "zh" ? "以完整分布表达结果——而非单一点估" : "Express outcomes as full distributions — not single-point estimates"}><ProbabilityEngine /></Section>}
        {tab === "scenarios" && <Section title={T("nav_scenarios")} sub={lang === "zh" ? "生成多条未来路径，从悲观到尾部极端" : "Generate multiple future paths — from pessimistic to tail-extreme"}><ScenarioGenerator /></Section>}
        {tab === "risk" && <Section title={T("nav_risk")} sub={lang === "zh" ? "识别下行风险、上行潜力与期望值非对称性" : "Identify downside risk, upside potential, and EV asymmetry"}><RiskMap /></Section>}
        {tab === "decision" && <Section title={T("nav_decision")} sub={lang === "zh" ? "在期望值、风险惩罚与期权价值之间作出选择" : "Choose among decisions priced on expected value, risk penalty, and optionality"}><DecisionUnderUncertainty /></Section>}
        {tab === "blackswan" && <Section title={T("nav_blackswan")} sub={lang === "zh" ? "稀有高影响事件如何主导结果——正态世界的盲区" : "How rare high-impact events dominate outcomes — and why normal-world intuitions fail"}><BlackSwanDetector /></Section>}
        {tab === "branching" && <Section title={T("nav_branching")} sub={lang === "zh" ? "将未来建模为分支概率树，量化每条路径的期望贡献" : "Model the future as a branching probability tree — quantify the EV of every path"}><BranchingFutures /></Section>}
        {tab === "analyst"  && <Section title={T("nav_analyst")}  sub={lang === "zh" ? "跨模块综合评估：识别结构性风险、尾部主导项与稳健决策路径" : "Cross-module synthesis: identify structural risks, tail-dominant findings, and robust decisions"}><RiskAnalyst /></Section>}
      </main>

      <footer className="border-t border-[var(--line)] py-6 text-center text-[11px] font-mono text-[var(--ink-dim)] tracking-[0.12em]">
        {T("footer")}
      </footer>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-medium tracking-tight mb-2">{title}</h1>
        <p className="text-[14px] text-[var(--ink-soft)] font-mono">{sub}</p>
        <div className="divider mt-4" />
      </div>
      {children}
    </div>
  );
}

const MODULE_CARDS = [
  {
    id: "engine" as Tab,
    icon: "⊕",
    title: { en: "Probability Space", zh: "概率空间" },
    body: { en: "Replace point estimates with full distributions. Set mean, variance, tail shape. See how uncertainty compounds.", zh: "以完整分布替代点估。设置均值、方差、尾部形态。观察不确定性如何复合叠加。" },
    accent: "var(--good)",
  },
  {
    id: "scenarios" as Tab,
    icon: "⎇",
    title: { en: "Scenario Generator", zh: "情景生成器" },
    body: { en: "Run 800 Monte Carlo paths. Extract P5 / P50 / P95 / P99 scenarios. Build fan charts with jump risk.", zh: "运行 800 条蒙特卡洛路径。提取 P5/P50/P95/P99 情景。构建含跳跃风险的扇形图。" },
    accent: "var(--baseline)",
  },
  {
    id: "risk" as Tab,
    icon: "◈",
    title: { en: "Risk Map", zh: "风险图" },
    body: { en: "Plot risks on probability × impact space. Compute EV asymmetry. Identify black-swan zones.", zh: "在概率 × 影响空间绘制风险。计算期望值非对称性。识别黑天鹅区域。" },
    accent: "var(--downside)",
  },
  {
    id: "decision" as Tab,
    icon: "⊞",
    title: { en: "Decision Under Uncertainty", zh: "不确定性下的决策" },
    body: { en: "Score decisions by E[·] − λ·σ − κ·tail + ω·reversibility. Tune preferences, see rankings flip in real time.", zh: "以 E[·] − λ·σ − κ·尾部 + ω·可逆性 为决策评分。调整偏好，实时看排序翻转。" },
    accent: "var(--accent)",
  },
  {
    id: "blackswan" as Tab,
    icon: "⬦",
    title: { en: "Black Swan Detector", zh: "黑天鹅探测器" },
    body: { en: "Compare normal vs fat-tail survival curves. See how a 1% event with 100× impact can equal 99% × 5.", zh: "对比正态与重尾生存曲线。理解 1% 概率 × 100 倍影响如何等于 99% × 5。" },
    accent: "var(--tail)",
  },
  {
    id: "branching" as Tab,
    icon: "⑂",
    title: { en: "Branching Futures", zh: "分支未来" },
    body: { en: "Build a decision tree with path probabilities. See which leaf dominates EV. Quantify the value of pruning tail branches.", zh: "构建含路径概率的决策树。识别主导期望值的叶节点。量化剪除尾部分支的价值。" },
    accent: "var(--upside)",
  },
  {
    id: "analyst" as Tab,
    icon: "⊛",
    title: { en: "Risk Analyst", zh: "风险分析师" },
    body: { en: "Synthesis layer across all modules. 2 critical risks, 2 warnings, 2 insights, 1 robust signal — with recommended actions.", zh: "跨模块综合层。2 项严重风险、2 项警告、2 项洞见、1 项稳健信号——附推荐行动。" },
    accent: "var(--tail)",
  },
];

function Overview({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { lang, T } = useLang();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="grid-bg rounded-[3px] border border-[var(--line)] px-10 py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(94,234,212,0.04)] via-transparent to-[rgba(182,147,255,0.04)] pointer-events-none" />
        <div className="relative max-w-[720px]">
          <div className="k mb-4">{T("hero_kicker")}</div>
          <h1 className="text-[42px] md:text-[52px] font-medium tracking-tight leading-[1.1] mb-6">
            {lang === "en" ? (
              <>Stop predicting.<br /><span className="text-[var(--accent)]">Start pricing</span> the distribution.</>
            ) : (
              <>停止预测。<br />开始为<span className="text-[var(--accent)]">分布定价</span>。</>
            )}
          </h1>
          <p className="text-[16px] text-[var(--ink-soft)] leading-[1.75] measure mb-8">
            {T("hero_body")}
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onNavigate("engine")} className="btn btn-primary">
              {T("hero_cta_engine")} →
            </button>
            <button onClick={() => onNavigate("scenarios")} className="btn">
              {T("hero_cta_scen")} →
            </button>
          </div>
        </div>
      </div>

      {/* Module grid */}
      <div>
        <div className="k mb-6">{lang === "zh" ? "模块" : "Modules"}</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULE_CARDS.map(m => (
            <button key={m.id} onClick={() => onNavigate(m.id)}
              className="card p-5 text-left hover:border-[var(--accent)] transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[20px]" style={{ color: m.accent }}>{m.icon}</span>
                <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--ink)]">{m.title[lang]}</span>
              </div>
              <p className="text-[13px] text-[var(--ink-soft)] leading-[1.65]">{m.body[lang]}</p>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-dim)] group-hover:text-[var(--accent)] transition-all">
                {lang === "zh" ? "进入 →" : "Open →"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Manifesto */}
      <div className="card p-8 border-[var(--line)]">
        <h2 className="text-[22px] font-medium mb-4">{T("goal_title")}</h2>
        <p className="text-[15px] text-[var(--ink-soft)] leading-[1.8] measure mb-6">{T("goal_body")}</p>
        <div className="grid md:grid-cols-3 gap-6 text-[13px]">
          {[
            { en: "Distributions, not points", zh: "分布，而非点估", body_en: "Every outcome is expressed as a probability-weighted range. The single number is a lie.", body_zh: "每个结果都以概率加权区间表达。单一数字是谎言。" },
            { en: "Tails, not averages", zh: "尾部，而非均值", body_en: "Black swans are not exceptions to model around — they are the core of the distribution.", body_zh: "黑天鹅不是需要绕过的例外——它们是分布的核心。" },
            { en: "Expected value + optionality", zh: "期望值 + 期权价值", body_en: "A decision is scored on mean − risk penalty + reversibility value. Preferences are explicit.", body_zh: "决策评分 = 均值 − 风险惩罚 + 可逆性价值。偏好是显式的。" },
          ].map((p, i) => (
            <div key={i} className="border-l-2 border-[var(--line)] pl-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)] mb-2">{lang === "zh" ? p.zh : p.en}</div>
              <p className="text-[var(--ink-soft)] leading-[1.6]">{lang === "zh" ? p.body_zh : p.body_en}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System model */}
      <div className="card p-8">
        <div className="k mb-4">{lang === "zh" ? "系统模型" : "System model"}</div>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <pre className="font-mono text-[12px] text-[var(--ink-soft)] leading-[1.8] whitespace-pre-wrap">{`Future = {
  outcomes[],
  probabilities[],
  impact[]
}

Decision Score =
  Expected Value
  − Risk Penalty      (λ · σ + κ · P(tail) · |tail|)
  + Optionality Value (ω · reversibility · |E[·]|)`}</pre>
          </div>
          <div className="space-y-3 text-[13px]">
            <p className="text-[var(--ink-soft)] leading-[1.7]">
              {lang === "zh"
                ? "λ 是你对波动的厌恶程度。κ 是你对尾部的额外惩罚。ω 是你对保留未来选择权的估值。"
                : "λ is your aversion to volatility. κ is your extra penalty for tail exposure. ω is how much you value keeping your future options open."}
            </p>
            <p className="text-[var(--ink-soft)] leading-[1.7]">
              {lang === "zh"
                ? "没有「正确」的λ、κ、ω。但若不明确声明，你的隐含值就是你真正的决策框架——而你从未审视过它。"
                : "There is no correct λ, κ, ω. But if you don't declare them, your implicit values are your actual decision framework — and you've never examined it."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
