/**
 * Ported from formatHMS(), app.html lines 5899-5908, and the `pad` helper
 * (line 5762: `const pad = (n) => String(n).padStart(2, '0')`).
 */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatHMS(totalSecondsInput: number): string {
  const total = Math.max(0, Math.ceil(totalSecondsInput));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
