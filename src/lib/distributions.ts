// Pure-math distribution helpers for the Probability Space Engine.
// Deterministic seeded RNG so views are reproducible.

export type DistKind = "normal" | "lognormal" | "triangular" | "mixture";

export type DistParams =
  | { kind: "normal"; mean: number; sd: number }
  | { kind: "lognormal"; mu: number; sigma: number }
  | { kind: "triangular"; min: number; mode: number; max: number }
  | { kind: "mixture"; a: { kind: "normal"; mean: number; sd: number }; b: { kind: "normal"; mean: number; sd: number }; weight: number };

const SQRT_2PI = Math.sqrt(2 * Math.PI);

export function normalPdf(x: number, mean: number, sd: number): number {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * SQRT_2PI);
}

// erf approximation (Abramowitz & Stegun 7.1.26)
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

export function normalCdf(x: number, mean: number, sd: number) {
  return 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));
}

export function lognormalPdf(x: number, mu: number, sigma: number) {
  if (x <= 0) return 0;
  const z = (Math.log(x) - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (x * sigma * SQRT_2PI);
}

export function lognormalCdf(x: number, mu: number, sigma: number) {
  if (x <= 0) return 0;
  return 0.5 * (1 + erf((Math.log(x) - mu) / (sigma * Math.SQRT2)));
}

export function triangularPdf(x: number, min: number, mode: number, max: number) {
  if (x < min || x > max) return 0;
  if (x < mode) return (2 * (x - min)) / ((max - min) * (mode - min));
  if (x === mode) return 2 / (max - min);
  return (2 * (max - x)) / ((max - min) * (max - mode));
}

export function pdf(x: number, p: DistParams): number {
  switch (p.kind) {
    case "normal": return normalPdf(x, p.mean, p.sd);
    case "lognormal": return lognormalPdf(x, p.mu, p.sigma);
    case "triangular": return triangularPdf(x, p.min, p.mode, p.max);
    case "mixture":
      return p.weight * normalPdf(x, p.a.mean, p.a.sd) + (1 - p.weight) * normalPdf(x, p.b.mean, p.b.sd);
  }
}

export function cdf(x: number, p: DistParams): number {
  switch (p.kind) {
    case "normal": return normalCdf(x, p.mean, p.sd);
    case "lognormal": return lognormalCdf(x, p.mu, p.sigma);
    case "triangular": {
      if (x <= p.min) return 0;
      if (x >= p.max) return 1;
      if (x < p.mode) return ((x - p.min) ** 2) / ((p.max - p.min) * (p.mode - p.min));
      return 1 - ((p.max - x) ** 2) / ((p.max - p.min) * (p.max - p.mode));
    }
    case "mixture":
      return p.weight * normalCdf(x, p.a.mean, p.a.sd) + (1 - p.weight) * normalCdf(x, p.b.mean, p.b.sd);
  }
}

// Numeric stats over a domain
export type DomainStats = {
  mean: number;
  std: number;
  median: number;
  p05: number; p25: number; p75: number; p95: number; p99: number;
  skew: number;
  // probability of extreme (>= mean + 2σ or <= mean - 2σ)
  tailProb: number;
};

export function statsFromGrid(p: DistParams, xs: number[]): DomainStats {
  const dx = xs[1] - xs[0];
  let mean = 0;
  let varSum = 0;
  let skewSum = 0;
  const probs = xs.map(x => pdf(x, p) * dx);
  const total = probs.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < xs.length; i++) mean += xs[i] * probs[i] / total;
  for (let i = 0; i < xs.length; i++) varSum += probs[i] * (xs[i] - mean) ** 2 / total;
  const std = Math.sqrt(varSum);
  for (let i = 0; i < xs.length; i++) {
    const d = (xs[i] - mean) / (std || 1);
    skewSum += probs[i] * d ** 3 / total;
  }

  const cum: number[] = [];
  let acc = 0;
  for (const pp of probs) { acc += pp / total; cum.push(acc); }
  const q = (target: number) => {
    let i = 0;
    while (i < cum.length && cum[i] < target) i++;
    return xs[Math.min(i, xs.length - 1)];
  };

  const lo = mean - 2 * std;
  const hi = mean + 2 * std;
  let tail = 0;
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] < lo || xs[i] > hi) tail += probs[i] / total;
  }

  return {
    mean,
    std,
    median: q(0.5),
    p05: q(0.05),
    p25: q(0.25),
    p75: q(0.75),
    p95: q(0.95),
    p99: q(0.99),
    skew: skewSum,
    tailProb: tail,
  };
}

// Power-law ("Pareto-style fat tail") for the Black Swan detector.
// Returns 1 - F(x) (survival).
export function paretoSurvival(x: number, xm: number, alpha: number): number {
  if (x <= xm) return 1;
  return Math.pow(xm / x, alpha);
}
export function paretoPdf(x: number, xm: number, alpha: number): number {
  if (x < xm) return 0;
  return alpha * Math.pow(xm, alpha) / Math.pow(x, alpha + 1);
}

// Linspace helper
export function linspace(a: number, b: number, n: number): number[] {
  const out = new Array(n);
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) out[i] = a + i * step;
  return out;
}

// Mulberry32 seeded RNG
export function rng32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller normal sample using a seeded uniform
export function sampleNormal(rng: () => number, mean = 0, sd = 1): number {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = rng();
  u2 = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
