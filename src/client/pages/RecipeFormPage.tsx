import { useMemo, useState } from "preact/hooks";
import { useLocation, useRoute } from "preact-iso";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
  type Recipe,
  type RecipeInput,
  recipeInputSchema,
} from "../../shared/recipe";
import { hasQuantity, isUnit, UNITS, type Unit } from "../../shared/units";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Header } from "../components/Header";
import { CloseIcon, PlusIcon } from "../components/Icons";
import { LoadState } from "../components/LoadState";
import { Toast, useToast } from "../components/Toast";
import { listUrl } from "../lib/navigation";
import { useRecipes } from "../lib/recipes";

type Row = { key: number; name: string; quantity: string; unit: Unit };

type FormState = {
  title: string;
  category: Category | null;
  tiktokUrl: string;
  memo: string;
  rows: Row[];
};

type Errors = Partial<Record<"title" | "category" | "tiktokUrl" | "ingredients", string>>;

let nextRowKey = 0;
const blankRow = (): Row => ({ key: nextRowKey++, name: "", quantity: "", unit: "g" });

function initialState(recipe: Recipe | undefined): FormState {
  if (!recipe) {
    return {
      title: "",
      category: null,
      tiktokUrl: "",
      memo: "",
      rows: [blankRow(), blankRow(), blankRow()],
    };
  }
  return {
    title: recipe.title,
    category: recipe.category,
    tiktokUrl: recipe.tiktokUrl ?? "",
    memo: recipe.memo ?? "",
    rows: [
      ...recipe.ingredients.map((i) => ({
        key: nextRowKey++,
        name: i.name,
        quantity: i.quantity === null ? "" : String(i.quantity),
        unit: i.unit,
      })),
      blankRow(),
    ],
  };
}

/** 入力内容を検証し、API に送る形に変換する */
function validate(form: FormState): { input?: RecipeInput; errors: Errors } {
  const errors: Errors = {};
  const tiktokUrl = form.tiktokUrl.trim();
  const filled = form.rows.filter((r) => r.name.trim());

  if (!form.title.trim()) errors.title = "料理名を入力してください";
  if (!form.category) errors.category = "カテゴリを選んでください";
  if (tiktokUrl && !/^https?:\/\/\S+$/.test(tiktokUrl)) {
    errors.tiktokUrl = "https:// から始まるURLを入力してください";
  }
  if (filled.length === 0) {
    errors.ingredients = "材料を1つ以上入力してください";
  } else if (filled.some((r) => hasQuantity(r.unit) && !(Number(r.quantity) > 0))) {
    errors.ingredients = "数量を入力してください（適量・少々は不要）";
  }
  if (Object.keys(errors).length > 0) return { errors };

  const parsed = recipeInputSchema.safeParse({
    title: form.title,
    category: form.category,
    tiktokUrl: tiktokUrl || null,
    memo: form.memo.trim() || null,
    ingredients: filled.map((r) => ({
      name: r.name,
      quantity: hasQuantity(r.unit) ? Number(r.quantity) : null,
      unit: r.unit,
    })),
  });
  if (!parsed.success) {
    return {
      errors: { ingredients: "入力内容を確認してください（文字数が多すぎる可能性があります）" },
    };
  }
  return { input: parsed.data, errors };
}

const fieldClass = "min-h-12 rounded-[10px] border bg-white px-3.5 text-base";

export function RecipeFormPage() {
  const { params } = useRoute();
  const { recipes, status } = useRecipes();
  const id = params.id ? Number(params.id) : undefined;
  const recipe = id === undefined ? undefined : recipes.find((r) => r.id === id);

  if (id !== undefined && !recipe) {
    return (
      <>
        <Header title="レシピ編集" onBack={() => history.back()} />
        <LoadState />
        {status === "ready" && (
          <p class="mt-12 text-center text-sm text-muted">レシピが見つかりません</p>
        )}
      </>
    );
  }
  return <RecipeForm key={id ?? "new"} recipe={recipe} />;
}

function RecipeForm({ recipe }: { recipe: Recipe | undefined }) {
  const { route } = useLocation();
  const { recipes, createRecipe, updateRecipe } = useRecipes();
  const [form, setForm] = useState(() => initialState(recipe));
  // 一度保存を押したら、以降は入力のたびにエラー表示を更新する
  const [submitted, setSubmitted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const toast = useToast();

  const errors = submitted ? validate(form).errors : {};

  const nameOptions = useMemo(
    () => [...new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.name)))],
    [recipes],
  );

  const update = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const updateRow = (key: number, patch: Partial<Row>) => {
    setForm((f) => ({ ...f, rows: f.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
    setDirty(true);
  };
  const removeRow = (key: number) => {
    setForm((f) => {
      const rows = f.rows.filter((r) => r.key !== key);
      return { ...f, rows: rows.length > 0 ? rows : [blankRow()] };
    });
    setDirty(true);
  };

  const leave = () => route(recipe ? `/recipes/${recipe.id}` : listUrl());
  const onBack = () => (dirty ? setConfirmingDiscard(true) : leave());

  const onSave = async () => {
    const { input } = validate(form);
    setSubmitted(true);
    if (!input) return;

    setSaving(true);
    try {
      if (recipe) {
        await updateRecipe(recipe.id, input);
        route(`/recipes/${recipe.id}`);
      } else {
        await createRecipe(input);
        route("/");
      }
    } catch (e) {
      console.error(e);
      setSaving(false);
      toast.show("保存できませんでした", false);
    }
  };

  return (
    <>
      <Header title={recipe ? "レシピ編集" : "レシピ登録"} onBack={onBack}>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          class="min-h-10 rounded-full bg-primary px-[18px] font-bold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </Header>

      <main class="flex flex-col gap-5 px-4 pt-5 pb-12">
        <div class="flex flex-col gap-1.5">
          <label for="f-title" class="text-sm font-bold">
            料理名 <span class="text-danger">*</span>
          </label>
          <input
            id="f-title"
            type="text"
            value={form.title}
            onInput={(e) => update({ title: e.currentTarget.value })}
            placeholder="例：鶏むねの甘辛焼き"
            maxLength={100}
            class={`${fieldClass} ${errors.title ? "border-danger" : "border-field"}`}
          />
          {errors.title && <span class="text-[13px] text-danger">{errors.title}</span>}
        </div>

        <fieldset class="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend class="mb-1.5 p-0 text-sm font-bold">
            カテゴリ <span class="text-danger">*</span>
          </legend>
          <div class="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const active = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ category: c })}
                  class={`min-h-11 rounded-[10px] border font-bold ${
                    active
                      ? "border-primary bg-primary text-white"
                      : `bg-white text-primary ${errors.category ? "border-danger" : "border-outline"}`
                  }`}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>
          {errors.category && <span class="text-[13px] text-danger">{errors.category}</span>}
        </fieldset>

        <div class="flex flex-col gap-1.5">
          <label for="f-url" class="text-sm font-bold">
            TikTokリンク
          </label>
          <input
            id="f-url"
            type="url"
            inputMode="url"
            value={form.tiktokUrl}
            onInput={(e) => update({ tiktokUrl: e.currentTarget.value })}
            placeholder="https://www.tiktok.com/..."
            class={`${fieldClass} ${errors.tiktokUrl ? "border-danger" : "border-field"}`}
          />
          {errors.tiktokUrl && <span class="text-[13px] text-danger">{errors.tiktokUrl}</span>}
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-sm font-bold">
            材料 <span class="text-danger">*</span>
          </span>
          <div
            aria-hidden="true"
            class="grid grid-cols-[minmax(0,1fr)_72px_92px_36px] gap-1.5 px-0.5 text-xs text-muted"
          >
            <span>材料名</span>
            <span>数量</span>
            <span>単位</span>
            <span />
          </div>
          {form.rows.map((row, index) => {
            const n = index + 1;
            const withQuantity = hasQuantity(row.unit);
            return (
              <div
                key={row.key}
                class="grid grid-cols-[minmax(0,1fr)_72px_92px_36px] items-center gap-1.5"
              >
                <input
                  type="text"
                  value={row.name}
                  onInput={(e) => updateRow(row.key, { name: e.currentTarget.value })}
                  list="ingredient-names"
                  aria-label={`材料${n}の名前`}
                  placeholder="材料名"
                  maxLength={50}
                  class="min-h-11 min-w-0 rounded-lg border border-field bg-white px-2.5 text-base"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={row.quantity}
                  onInput={(e) => updateRow(row.key, { quantity: e.currentTarget.value })}
                  disabled={!withQuantity}
                  aria-label={`材料${n}の数量`}
                  placeholder={withQuantity ? "0" : "—"}
                  class="min-h-11 min-w-0 rounded-lg border border-field bg-white px-2 text-right text-base disabled:bg-line-soft"
                />
                <select
                  value={row.unit}
                  onChange={(e) => {
                    const unit = e.currentTarget.value;
                    if (!isUnit(unit)) return;
                    updateRow(row.key, hasQuantity(unit) ? { unit } : { unit, quantity: "" });
                  }}
                  aria-label={`材料${n}の単位`}
                  class="min-h-11 min-w-0 rounded-lg border border-field bg-white px-1.5 text-[15px]"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  aria-label={`材料${n}を削除`}
                  class="flex h-11 w-9 items-center justify-center rounded-lg text-muted hover:bg-line-soft"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            );
          })}
          <datalist id="ingredient-names">
            {nameOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => update({ rows: [...form.rows, blankRow()] })}
            class="flex min-h-11 items-center gap-1.5 self-start rounded-[10px] border border-dashed border-outline px-3.5 font-bold text-primary"
          >
            <PlusIcon size={18} />
            材料を追加
          </button>
          {errors.ingredients && <span class="text-[13px] text-danger">{errors.ingredients}</span>}
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="f-memo" class="text-sm font-bold">
            メモ
          </label>
          <textarea
            id="f-memo"
            rows={4}
            value={form.memo}
            onInput={(e) => update({ memo: e.currentTarget.value })}
            placeholder="コツや注意点など"
            maxLength={1000}
            class="resize-y rounded-[10px] border border-field bg-white px-3.5 py-3 text-base"
          />
        </div>
      </main>

      {confirmingDiscard && (
        <ConfirmDialog
          title="入力内容を破棄しますか？"
          message="保存していない変更は失われます。"
          confirmLabel="破棄"
          onConfirm={leave}
          onCancel={() => setConfirmingDiscard(false)}
        />
      )}
      <Toast toast={toast.toast} />
    </>
  );
}
