export function fmt(x: number, digits = 2): string {
  if (!isFinite(x)) return "—";
  if (Math.abs(x) >= 1000) return x.toFixed(0);
  if (Math.abs(x) >= 100) return x.toFixed(1);
  return x.toFixed(digits);
}

export function pct(x: number, digits = 1): string {
  if (!isFinite(x)) return "—";
  return `${(x * 100).toFixed(digits)}%`;
}

export function signed(x: number, digits = 2): string {
  if (!isFinite(x)) return "—";
  return (x >= 0 ? "+" : "") + x.toFixed(digits);
}
