import { useState } from "preact/hooks";
import { useLocation, useRoute } from "preact-iso";
import { formatAmount } from "../../shared/units";
import { CategoryBadge } from "../components/CategoryBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Header } from "../components/Header";
import { ExternalIcon } from "../components/Icons";
import { LoadState } from "../components/LoadState";
import { Toast, useToast } from "../components/Toast";
import { listUrl } from "../lib/navigation";
import { useRecipes } from "../lib/recipes";
import { useSelection } from "../lib/selection";

export function RecipeDetailPage() {
  const { route } = useLocation();
  const { params } = useRoute();
  const { recipes, status, deleteRecipe } = useRecipes();
  const { isSelected, toggle } = useSelection();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const id = Number(params.id);
  const recipe = recipes.find((r) => r.id === id);
  const goBack = () => route(listUrl());

  if (!recipe) {
    return (
      <>
        <Header onBack={goBack} />
        <LoadState />
        {status === "ready" && (
          <p class="mt-12 text-center text-sm text-muted">レシピが見つかりません</p>
        )}
      </>
    );
  }

  const selected = isSelected(recipe.id);

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      route(listUrl());
    } catch (e) {
      console.error(e);
      setDeleting(false);
      setConfirming(false);
      toast.show("削除できませんでした", false);
    }
  };

  return (
    <>
      <Header onBack={goBack}>
        <button
          type="button"
          onClick={() => route(`/recipes/${recipe.id}/edit`)}
          class="min-h-11 rounded-lg px-3.5 font-bold text-primary hover:bg-line-soft"
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          class="min-h-11 rounded-lg px-3.5 font-bold text-danger hover:bg-line-soft"
        >
          削除
        </button>
      </Header>

      <main class="flex flex-col gap-5 px-4 pt-5 pb-32">
        <div class="flex flex-col items-start gap-2.5">
          <CategoryBadge category={recipe.category} />
          <h1 class="text-2xl leading-snug font-bold">{recipe.title}</h1>
          {recipe.tiktokUrl && (
            <a
              href={recipe.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white no-underline"
            >
              TikTokで見る
              <ExternalIcon size={16} />
            </a>
          )}
        </div>

        <section class="flex flex-col gap-2">
          <h2 class="text-[13px] font-medium text-muted">材料</h2>
          <div class="rounded-xl border border-line bg-white py-1">
            {recipe.ingredients.map((i, index) => (
              <div key={index} class="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <span>{i.name}</span>
                <span class="font-bold">{formatAmount(i.quantity, i.unit)}</span>
              </div>
            ))}
          </div>
        </section>

        {recipe.memo && (
          <section class="flex flex-col gap-2">
            <h2 class="text-[13px] font-medium text-muted">メモ</h2>
            <p class="rounded-xl border border-line bg-white px-4 py-3.5 whitespace-pre-wrap">
              {recipe.memo}
            </p>
          </section>
        )}
      </main>

      <div class="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white">
        <div class="mx-auto max-w-lg px-4 pt-3 pb-safe">
          <button
            type="button"
            onClick={() => toggle(recipe.id)}
            class={`min-h-[52px] w-full rounded-xl border border-primary font-bold ${
              selected ? "bg-white text-primary" : "bg-primary text-white hover:bg-primary-hover"
            }`}
          >
            {selected ? "材料一覧から外す" : "材料一覧に追加"}
          </button>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title="レシピを削除しますか？"
          message={`「${recipe.title}」を削除します。元に戻せません。`}
          confirmLabel="削除"
          busy={deleting}
          onConfirm={onDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
      <Toast toast={toast.toast} />
    </>
  );
}
