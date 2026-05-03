export type Lang = "en" | "zh";
export type Bilingual = { en: string; zh: string };
export const t = (b: Bilingual, lang: Lang) => b[lang];

export const ui = {
  brand: { en: "Uncertainty OS", zh: "不确定性操作系统" },
  brand_sub: { en: "Model · navigate · act under uncertainty", zh: "建模 · 导航 · 在不确定性下行动" },

  nav_overview: { en: "Overview", zh: "总览" },
  nav_engine: { en: "Probability Space", zh: "概率空间" },
  nav_scenarios: { en: "Scenarios", zh: "情景" },
  nav_risk: { en: "Risk Map", zh: "风险图" },
  nav_decision: { en: "Decisions", zh: "决策" },
  nav_blackswan: { en: "Black Swans", zh: "黑天鹅" },
  nav_branching: { en: "Branching Futures", zh: "分支未来" },
  nav_analyst: { en: "Analyst", zh: "分析师" },

  hero_kicker: { en: "A system to model, navigate, and act under uncertainty", zh: "建模、导航并在不确定性下行动的系统" },
  hero_title: { en: "Stop predicting. Start pricing the distribution.", zh: "停止预测。开始为分布定价。" },
  hero_body: {
    en: "The future is not a number. It is a probability space — with ranges, asymmetries, and tails. Uncertainty OS is a working surface for distributions, scenarios, risks, and decisions. Every screen forces you to commit to a range, not a point — and to confront how small probabilities can dominate outcomes.",
    zh: "未来不是一个数字，而是一个概率空间——含范围、非对称与尾部。Uncertainty OS 是面向分布、情景、风险与决策的工作平面。每个界面都迫使你给出区间而非点估，并面对「小概率事件如何主导结果」这一现实。",
  },
  hero_cta_engine: { en: "Open the engine", zh: "打开引擎" },
  hero_cta_scen: { en: "Generate scenarios", zh: "生成情景" },

  goal_title: { en: "This is not a forecasting tool.", zh: "这不是一个预测工具。" },
  goal_body: {
    en: "It is a working surface for thinking in probabilities, pricing tails, and choosing among decisions whose payoffs are not numbers but distributions.",
    zh: "它是用于「以概率思考、为尾部定价、在收益本身就是分布的决策中作出选择」的工作平面。",
  },

  footer: { en: "Part of the Psyverse — independent research portfolio by Gewenbo.", zh: "Psyverse 投资组合的一部分 — Gewenbo 独立研究项目。" },
} satisfies Record<string, Bilingual>;

export type UIKey = keyof typeof ui;
