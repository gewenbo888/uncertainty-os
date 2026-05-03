"use client";
import { useState } from "react";
import { useLang } from "@/i18n/LangProvider";

type Finding = {
  id: string;
  severity: "critical" | "warning" | "insight" | "safe";
  module: { en: string; zh: string };
  title: { en: string; zh: string };
  body: { en: string; zh: string };
  action: { en: string; zh: string };
};

const FINDINGS: Finding[] = [
  {
    id: "f1",
    severity: "critical",
    module: { en: "Black Swans", zh: "黑天鹅" },
    title: { en: "Fat-tail risk is systematically underweighted", zh: "重尾风险被系统性低估" },
    body: {
      en: "At default settings, the Pareto tail gives P(X > 100) ≈ 1,000× higher probability than the normal model. Most intuitions are calibrated on normal-world experience and will price this tail near zero.",
      zh: "在默认参数下，幂律尾部给出 P(X > 100) 约为正态模型的 1,000 倍。大多数直觉基于正态世界经验，会将此尾部定价趋近于零。",
    },
    action: {
      en: "Explicitly run the Black Swan module. If ≥3 checklist items apply, restructure decisions toward tail-robustness before optimizing for expected value.",
      zh: "明确运行黑天鹅模块。若 ≥3 条检查项适用，在优化期望值之前先将决策结构调整为尾部稳健型。",
    },
  },
  {
    id: "f2",
    severity: "critical",
    module: { en: "Risk Map", zh: "风险图" },
    title: { en: "Downside EV exceeds upside EV by 1.24×", zh: "下行期望值超出上行期望值 1.24 倍" },
    body: {
      en: "The default risk register shows downside EV of −9.8% vs upside EV of +7.9%. The portfolio is negatively asymmetric. A risk-neutral agent should prefer the status quo.",
      zh: "默认风险登记册显示下行 EV 为 −9.8%，上行 EV 为 +7.9%。组合呈负向非对称。风险中性主体应偏好维持现状。",
    },
    action: {
      en: "Identify and reduce the two highest-EV downside risks (r3: regulatory, r6: cyber). Each has both low probability and high impact — classic tail candidates.",
      zh: "识别并降低两个最高 EV 下行风险（r3：监管，r6：网络安全）。两者均为低概率、高影响——典型尾部候选项。",
    },
  },
  {
    id: "f3",
    severity: "warning",
    module: { en: "Scenario Generator", zh: "情景生成器" },
    title: { en: "P99 terminal value is 2.6× the P50 — the baseline is misleading", zh: "P99 终值是 P50 的 2.6 倍——基线具有误导性" },
    body: {
      en: "At default parameters, the P50 scenario at t=24 lands near 115 while the P99 exceeds 300. Planning against the median ignores a meaningful slice of the probability mass in the right tail.",
      zh: "在默认参数下，t=24 时 P50 情景约为 115，而 P99 超过 300。依据中位数规划会忽视右尾部分的可观概率质量。",
    },
    action: {
      en: "Build plans that are viable at P50 and don't catastrophically fail at P5. Separately ask: do you have optionality to capture P95+ upside if it materializes?",
      zh: "制定在 P50 可行、在 P5 不会灾难性失败的计划。另行确认：若 P95+ 上行实现，你是否具备捕获它的期权？",
    },
  },
  {
    id: "f4",
    severity: "warning",
    module: { en: "Decisions", zh: "决策" },
    title: { en: "Optimal decision is highly sensitive to tail-penalty κ", zh: "最优决策对尾部惩罚 κ 高度敏感" },
    body: {
      en: "At κ < 0.8, 'Concentrate on one bet' ranks #1. At κ > 1.2, 'Wait & gather information' becomes optimal. A 50% change in tail aversion reverses the top recommendation entirely.",
      zh: "当 κ < 0.8 时，「集中下注」排名第一；当 κ > 1.2 时，「等待并收集信息」成为最优。尾部厌恶变化 50% 即完全逆转首选推荐。",
    },
    action: {
      en: "Before deciding, declare your κ explicitly and justify it. If you cannot justify a specific κ, you do not yet know your own risk preferences.",
      zh: "在决策前，明确声明你的 κ 并给出理由。若无法论证具体 κ 值，说明你尚未了解自己的风险偏好。",
    },
  },
  {
    id: "f5",
    severity: "insight",
    module: { en: "Branching Futures", zh: "分支未来" },
    title: { en: "The 'cascade' leaf (3.85% path probability) is EV-dominant among negatives", zh: "「级联崩溃」叶节点（路径概率 3.85%）在负向中主导期望值" },
    body: {
      en: "D → D2 (crisis → cascade) has a path probability of 0.07 × 0.55 = 3.85% yet terminal value of 20 — an EV contribution of −3.1. No other single branch contributes more negative EV.",
      zh: "D → D2（危机 → 级联）路径概率为 0.07 × 0.55 = 3.85%，终值为 20——EV 贡献为 −3.1。没有任何其他单一分支贡献更多负向 EV。",
    },
    action: {
      en: "Focus risk mitigation on preventing cascade, not on the crisis itself. A 50% reduction in cascade probability (D2) saves more EV than eliminating any moderate-probability downside entirely.",
      zh: "将风险缓解重点放在防止级联而非危机本身。将级联概率（D2）降低 50%，节省的 EV 超过完全消除任何中等概率下行风险。",
    },
  },
  {
    id: "f6",
    severity: "insight",
    module: { en: "Probability Space", zh: "概率空间" },
    title: { en: "Left-skewed distributions dominate operational risk; right-skewed ones dominate opportunity", zh: "左偏分布主导运营风险；右偏分布主导机会" },
    body: {
      en: "When modeling bounded downside processes (costs, delays, failures), use log-normal or beta. When modeling upside exposure (revenue, impact, growth), power-law distributions apply — there is no upper bound.",
      zh: "建模有界下行过程（成本、延误、故障）时，使用对数正态或贝塔分布。建模上行暴露（营收、影响、增长）时，幂律分布适用——不存在上界。",
    },
    action: {
      en: "In the Probability Space module, apply asymmetric distributions by default: beta for risks (bounded), Pareto for upsides (unbounded). Do not use a normal distribution for either.",
      zh: "在概率空间模块中，默认使用非对称分布：贝塔分布用于风险（有界），幂律分布用于上行（无界）。两者均不应使用正态分布。",
    },
  },
  {
    id: "f7",
    severity: "safe",
    module: { en: "Decisions", zh: "决策" },
    title: { en: "Barbell strategy is robust across the widest range of (λ, κ, ω)", zh: "杠铃策略在最宽泛的 (λ, κ, ω) 范围内保持稳健" },
    body: {
      en: "The barbell (safe + speculative) ranks in the top 2 across all tested parameter combinations. It is the only strategy with reversibility > 50% and tail risk < 20.",
      zh: "杠铃（安全 + 投机）在所有测试参数组合中均排名前两位。它是唯一一种可逆性 > 50% 且尾部风险 < 20 的策略。",
    },
    action: {
      en: "If uncertain about your own λ, κ, ω — default to the barbell. It is the minimax-regret strategy: worst rank is #2, never catastrophic.",
      zh: "若对自身 λ、κ、ω 不确定，默认选择杠铃。它是最小最大遗憾策略：最差排名为第 2，从不灾难性。",
    },
  },
];

const SEV_CONFIG = {
  critical: { label: { en: "CRITICAL", zh: "严重" }, color: "var(--bad)", bg: "rgba(239,96,128,0.08)" },
  warning:  { label: { en: "WARNING",  zh: "警告" }, color: "var(--warn)", bg: "rgba(240,198,116,0.08)" },
  insight:  { label: { en: "INSIGHT",  zh: "洞见" }, color: "var(--accent)", bg: "rgba(94,234,212,0.06)" },
  safe:     { label: { en: "ROBUST",   zh: "稳健" }, color: "var(--good)", bg: "rgba(94,234,212,0.06)" },
};

export function RiskAnalyst() {
  const { lang, B } = useLang();
  const [expanded, setExpanded] = useState<string | null>("f1");
  const [filter, setFilter] = useState<"all" | Finding["severity"]>("all");

  const critCount = FINDINGS.filter(f => f.severity === "critical").length;
  const warnCount = FINDINGS.filter(f => f.severity === "warning").length;
  const insightCount = FINDINGS.filter(f => f.severity === "insight").length;
  const safeCount = FINDINGS.filter(f => f.severity === "safe").length;

  const visible = filter === "all" ? FINDINGS : FINDINGS.filter(f => f.severity === filter);

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="card p-6 border-[var(--bad)]" style={{ borderColor: critCount > 0 ? "var(--bad)" : "var(--warn)" }}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="k mb-2">{lang === "zh" ? "风险分析师综合评估" : "Risk analyst synthesis"}</div>
            <h2 className="text-[20px] font-medium mb-2" style={{ color: critCount > 0 ? "var(--bad)" : "var(--warn)" }}>
              {lang === "zh"
                ? `发现 ${critCount} 项严重风险，${warnCount} 项警告，${insightCount} 项洞见`
                : `${critCount} critical risks · ${warnCount} warnings · ${insightCount} insights`}
            </h2>
            <p className="text-[13px] text-[var(--ink-soft)] leading-relaxed max-w-[580px]">
              {lang === "zh"
                ? "本分析综合所有模块的输出。严重项表示需要在做出承诺性决策前解决的结构性问题。"
                : "This analysis synthesizes outputs across all modules. Critical findings indicate structural issues that should be resolved before making a committed decision."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {(["all", "critical", "warning", "insight"] as const).map(s => (
              <button key={s}
                onClick={() => setFilter(f => f === s ? "all" : s)}
                className={`px-3 py-2 border text-[11px] font-mono uppercase tracking-[0.15em] transition-all rounded-[2px]
                  ${filter === s ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--line)] text-[var(--ink-dim)]"}`}>
                {s === "all"
                  ? (lang === "zh" ? `全部 ${FINDINGS.length}` : `All ${FINDINGS.length}`)
                  : s === "critical" ? (lang === "zh" ? `严重 ${critCount}` : `Critical ${critCount}`)
                  : s === "warning"  ? (lang === "zh" ? `警告 ${warnCount}`  : `Warning ${warnCount}`)
                  : (lang === "zh" ? `洞见 ${insightCount}` : `Insight ${insightCount}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Finding cards */}
      <div className="space-y-3">
        {visible.map(f => {
          const sev = SEV_CONFIG[f.severity];
          const isOpen = expanded === f.id;
          return (
            <div key={f.id} className="card overflow-hidden" style={{ background: isOpen ? sev.bg : undefined }}>
              <button
                className="w-full p-5 text-left flex items-start gap-4"
                onClick={() => setExpanded(isOpen ? null : f.id)}>
                <div className="shrink-0 mt-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 border"
                    style={{ color: sev.color, borderColor: sev.color, background: sev.bg }}>
                    {sev.label[lang]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-dim)]">{B(f.module)}</span>
                  </div>
                  <div className="text-[14px] font-medium">{B(f.title)}</div>
                </div>
                <span className="text-[var(--ink-dim)] font-mono text-[14px] shrink-0 mt-0.5">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-[var(--line)]">
                  <div className="pt-4 grid md:grid-cols-2 gap-5">
                    <div>
                      <div className="k mb-2">{lang === "zh" ? "分析" : "Analysis"}</div>
                      <p className="text-[13px] text-[var(--ink-soft)] leading-[1.75]">{B(f.body)}</p>
                    </div>
                    <div className="border-l border-[var(--line)] pl-5">
                      <div className="k mb-2" style={{ color: sev.color }}>{lang === "zh" ? "推荐行动" : "Recommended action"}</div>
                      <p className="text-[13px] text-[var(--ink)] leading-[1.75]">{B(f.action)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Framework card */}
      <div className="card p-6">
        <div className="k mb-4">{lang === "zh" ? "分析师工作框架" : "Analyst framework"}</div>
        <div className="grid md:grid-cols-3 gap-6 text-[13px]">
          {[
            {
              step: "01",
              title: { en: "Identify tail structure", zh: "识别尾部结构" },
              body: { en: "Before any EV calculation: is the distribution fat-tailed? Is variance dominated by one observation? If yes, normal-world tools mislead.", zh: "在任何期望值计算之前：分布是否为重尾？方差是否被单一观测主导？若是，正态世界工具会产生误导。" },
            },
            {
              step: "02",
              title: { en: "Map asymmetries", zh: "映射非对称性" },
              body: { en: "Downside EV vs upside EV ratio. If |downside| > upside, the decision set is negatively skewed — default to reversible choices.", zh: "下行 EV 与上行 EV 之比。若 |下行| > 上行，决策集呈负偏——默认选择可逆方案。" },
            },
            {
              step: "03",
              title: { en: "Declare preferences, then rank", zh: "声明偏好，再排序" },
              body: { en: "λ, κ, ω must be explicit before scoring. Changing preferences after seeing rankings is anchoring, not decision-making.", zh: "在评分前必须明确声明 λ、κ、ω。在看到排序后再改变偏好是锚定效应，而非决策制定。" },
            },
          ].map(item => (
            <div key={item.step}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] text-[var(--accent)]">{item.step}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--ink)]">{B(item.title)}</span>
              </div>
              <p className="text-[var(--ink-soft)] leading-[1.65]">{B(item.body)}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 border-l-2 border-[var(--tail)]">
          <p className="text-[13px] italic font-serif text-[var(--ink)] leading-[1.75]">
            {lang === "zh"
              ? "风险分析师的工作不是预测正确的结果。而是确保：你的模型准确反映了不确定性的形状；你的决策结构不会因单一尾部事件而被摧毁；你的偏好在承诺之前是明确且一致的。"
              : "The risk analyst's job is not to predict the correct outcome. It is to ensure: your model accurately reflects the shape of uncertainty; your decision structure cannot be destroyed by a single tail event; and your preferences are explicit and consistent before you commit."}
          </p>
        </div>
      </div>
    </div>
  );
}
