export const UNITS = [
  "g",
  "ml",
  "個",
  "本",
  "枚",
  "切れ",
  "尾",
  "束",
  "株",
  "玉",
  "片",
  "袋",
  "パック",
  "缶",
  "cm",
  "カップ",
  "大さじ",
  "小さじ",
  "適量",
  "少々",
] as const;

export type Unit = (typeof UNITS)[number];

/** 数量を持たない単位 */
const NO_QUANTITY_UNITS: ReadonlySet<Unit> = new Set(["適量", "少々"]);

/** 数値の前に付ける単位（大さじ2 など） */
const PREFIX_UNITS: ReadonlySet<Unit> = new Set(["大さじ", "小さじ", "カップ"]);

export function isUnit(value: string): value is Unit {
  return (UNITS as readonly string[]).includes(value);
}

export function hasQuantity(unit: Unit): boolean {
  return !NO_QUANTITY_UNITS.has(unit);
}

/** 小数第 2 位で丸め、末尾の 0 は表示しない */
export function formatQuantity(quantity: number): string {
  return String(Math.round(quantity * 100) / 100);
}

export function formatAmount(quantity: number | null, unit: Unit): string {
  if (!hasQuantity(unit) || quantity === null) return unit;
  const q = formatQuantity(quantity);
  return PREFIX_UNITS.has(unit) ? `${unit}${q}` : `${q}${unit}`;
}
