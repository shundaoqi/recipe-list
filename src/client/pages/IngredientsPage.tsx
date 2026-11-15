import { useLocation } from "preact-iso";
import { aggregateIngredients, toShoppingText } from "../../shared/aggregate";
import { Header } from "../components/Header";
import { CloseIcon, CopyIcon } from "../components/Icons";
import { Toast, useToast } from "../components/Toast";
import { copyText } from "../lib/clipboard";
import { listUrl } from "../lib/navigation";
import { useSelection } from "../lib/selection";

export function IngredientsPage() {
  const { route } = useLocation();
  const { selectedRecipes, toggle, clear } = useSelection();
  const toast = useToast();
  const rows = aggregateIngredients(selectedRecipes);
  const empty = selectedRecipes.length === 0;

  const onCopy = async () => {
    const ok = await copyText(toShoppingText(rows));
    toast.show(ok ? "コピーしました" : "コピーできませんでした", ok);
  };

  const onClear = () => {
    clear();
    route(listUrl());
  };

  return (
    <>
      <Header title="材料一覧" onBack={() => route(listUrl())} />

      <main class="flex flex-col gap-4 px-4 pt-4 pb-32">
        <section class="flex flex-col gap-2">
          <h2 class="text-[13px] font-medium text-muted">
            選択中の料理（{selectedRecipes.length}品）
          </h2>
          <div class="flex flex-col rounded-xl border border-line bg-white">
            {selectedRecipes.map((r) => (
              <div
                key={r.id}
                class="flex min-h-12 items-center gap-2 border-b border-line-soft pr-1 pl-4 last:border-b-0"
              >
                <span class="min-w-0 flex-1 truncate">{r.title}</span>
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  aria-label={`${r.title}を外す`}
                  class="flex size-11 items-center justify-center rounded-full text-muted hover:bg-line-soft"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            ))}
            {empty && <p class="p-4 text-sm text-muted">料理が選択されていません</p>}
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <h2 class="text-[13px] font-medium text-muted">材料（{rows.length}件）</h2>
          <div class="flex flex-col rounded-xl border border-line bg-white py-1">
            {rows.map((row) => (
              <div key={row.name} class="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <span>{row.name}</span>
                <span class="text-right font-bold">{row.amount}</span>
              </div>
            ))}
            {empty && (
              <p class="px-4 py-3 text-sm text-muted">
                レシピ一覧で料理を選ぶと、ここに材料が表示されます
              </p>
            )}
          </div>
        </section>
      </main>

      <div class="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white">
        <div class="mx-auto flex max-w-lg gap-3 px-4 pt-3 pb-safe">
          <button
            type="button"
            onClick={onClear}
            disabled={empty}
            class="min-h-[52px] flex-1 rounded-xl border border-outline bg-white font-bold text-primary disabled:opacity-50"
          >
            クリア
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={empty}
            class="flex min-h-[52px] flex-[2] items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            <CopyIcon size={20} />
            コピー
          </button>
        </div>
      </div>

      <Toast toast={toast.toast} />
    </>
  );
}
