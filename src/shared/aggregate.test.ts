import { describe, expect, it } from "vitest";
import { aggregateIngredients, toShoppingText } from "./aggregate";
import type { IngredientInput } from "./recipe";
import { formatAmount } from "./units";

const recipe = (...ingredients: IngredientInput[]) => ({ ingredients });

describe("aggregateIngredients", () => {
  it("同じ材料名・同じ単位を合算する", () => {
    const rows = aggregateIngredients([
      recipe({ name: "鶏もも肉", quantity: 300, unit: "g" }),
      recipe({ name: "鶏もも肉", quantity: 250, unit: "g" }),
    ]);
    expect(rows).toEqual([{ name: "鶏もも肉", amount: "550g" }]);
  });

  it("単位が違うものは並べて表示する", () => {
    const rows = aggregateIngredients([
      recipe({ name: "玉ねぎ", quantity: 1, unit: "個" }),
      recipe({ name: "玉ねぎ", quantity: 100, unit: "g" }),
    ]);
    expect(rows).toEqual([{ name: "玉ねぎ", amount: "1個 + 100g" }]);
  });

  it("適量・少々は合算せず単位名だけを 1 回表示する", () => {
    const rows = aggregateIngredients([
      recipe({ name: "塩", quantity: null, unit: "少々" }),
      recipe(
        { name: "塩", quantity: null, unit: "少々" },
        { name: "胡椒", quantity: null, unit: "適量" },
      ),
    ]);
    expect(rows).toEqual([
      { name: "塩", amount: "少々" },
      { name: "胡椒", amount: "適量" },
    ]);
  });

  it("材料名の前後の空白を無視し、最初に出てきた順に並べる", () => {
    const rows = aggregateIngredients([
      recipe(
        { name: "醤油", quantity: 2, unit: "大さじ" },
        { name: "みりん", quantity: 2, unit: "大さじ" },
      ),
      recipe({ name: " 醤油 ", quantity: 1, unit: "大さじ" }),
    ]);
    expect(rows).toEqual([
      { name: "醤油", amount: "大さじ3" },
      { name: "みりん", amount: "大さじ2" },
    ]);
  });

  it("小数を丸める", () => {
    const rows = aggregateIngredients([
      recipe({ name: "牛乳", quantity: 0.1, unit: "カップ" }),
      recipe({ name: "牛乳", quantity: 0.2, unit: "カップ" }),
    ]);
    expect(rows).toEqual([{ name: "牛乳", amount: "カップ0.3" }]);
  });

  it("何も選択していなければ空", () => {
    expect(aggregateIngredients([])).toEqual([]);
  });
});

describe("formatAmount", () => {
  it("単位の前後を使い分ける", () => {
    expect(formatAmount(300, "g")).toBe("300g");
    expect(formatAmount(2, "大さじ")).toBe("大さじ2");
    expect(formatAmount(1.5, "個")).toBe("1.5個");
    expect(formatAmount(null, "適量")).toBe("適量");
  });
});

describe("toShoppingText", () => {
  it("1 行 1 材料のテキストにする", () => {
    expect(
      toShoppingText([
        { name: "鶏もも肉", amount: "550g" },
        { name: "塩", amount: "少々" },
      ]),
    ).toBe("鶏もも肉 550g\n塩 少々");
  });
});
