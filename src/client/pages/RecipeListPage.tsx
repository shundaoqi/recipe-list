import { useEffect } from "preact/hooks";
import { useLocation } from "preact-iso";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "../../shared/recipe";
import { CategoryBadge } from "../components/CategoryBadge";
import { Header } from "../components/Header";
import { ChevronRightIcon, PlusIcon } from "../components/Icons";
import { LoadState } from "../components/LoadState";
import { rememberListUrl } from "../lib/navigation";
import { useRecipes } from "../lib/recipes";
import { useSelection } from "../lib/selection";

type Tab = "all" | Category;

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "すべて" },
  ...CATEGORIES.map((c) => ({ id: c, label: CATEGORY_LABELS[c] })),
];

function toTab(value: string | undefined): Tab {
  return (CATEGORIES as readonly string[]).includes(value ?? "") ? (value as Category) : "all";
}

export function RecipeListPage() {
  const { url, query, route } = useLocation();
  const { recipes, status } = useRecipes();
  const { isSelected, toggle, selectedRecipes } = useSelection();
  const tab = toTab(query.c);

  useEffect(() => rememberListUrl(url), [url]);

  const visible = tab === "all" ? recipes : recipes.filter((r) => r.category === tab);
  const selectedCount = selectedRecipes.length;

  return (
    <>
      <Header title="レシピ">
        <button
          type="button"
          onClick={() => route("/recipes/new")}
          aria-label="レシピを登録"
          class="flex size-11 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover"
        >
          <PlusIcon />
        </button>
      </Header>

      <nav
        aria-label="カテゴリ"
        class="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-3 [scrollbar-width:none]"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => route(t.id === "all" ? "/" : `/?c=${t.id}`, true)}
              class={`min-h-9 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-outline bg-white text-primary"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      <main class="flex flex-col gap-2 px-4 pt-3 pb-28">
        <LoadState />
        {status === "ready" && visible.length === 0 && (
          <p class="mt-12 text-center text-sm text-muted">
            {recipes.length === 0
              ? "右上の＋からレシピを登録しましょう"
              : "このカテゴリのレシピはまだありません"}
          </p>
        )}
        {visible.map((r) => {
          const checked = isSelected(r.id);
          const names = r.ingredients.map((i) => i.name);
          return (
            <div
              key={r.id}
              class={`flex items-stretch overflow-hidden rounded-xl border bg-white ${
                checked ? "border-primary" : "border-line"
              }`}
            >
              <label class="flex w-[52px] shrink-0 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(r.id)}
                  aria-label={`${r.title}を選択`}
                  class="m-0 size-[22px] accent-primary"
                />
              </label>
              <button
                type="button"
                onClick={() => route(`/recipes/${r.id}`)}
                class="flex min-w-0 flex-1 flex-col gap-0.5 py-3 pr-3.5 text-left"
              >
                <span class="flex w-full items-center gap-2">
                  <span class="min-w-0 flex-1 truncate font-bold">{r.title}</span>
                  <CategoryBadge category={r.category} />
                </span>
                <span class="w-full truncate text-[13px] text-muted">
                  {names.slice(0, 3).join("、")}
                  {names.length > 3 && "…"}
                </span>
              </button>
            </div>
          );
        })}
      </main>

      {selectedCount > 0 && (
        <div class="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-lg px-4 pb-safe">
          <button
            type="button"
            onClick={() => route("/ingredients")}
            class="flex min-h-14 w-full items-center justify-between rounded-2xl bg-primary px-5 font-bold text-white shadow-[0_4px_14px_rgba(58,30,11,0.2)] hover:bg-primary-hover"
          >
            <span>材料一覧を見る</span>
            <span class="flex items-center gap-1.5 text-sm font-medium">
              {selectedCount}品選択中
              <ChevronRightIcon size={18} />
            </span>
          </button>
        </div>
      )}
    </>
  );
}
