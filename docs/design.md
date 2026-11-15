# レシピリストアプリ 設計 v1.0

## 1. テーブル設計（D1 / SQLite）

### recipes（レシピ）

| カラム     | 型      | 制約                                                              | 内容                         |
| ---------- | ------- | ----------------------------------------------------------------- | ---------------------------- |
| id         | INTEGER | PK, 自動採番                                                      |                              |
| title      | TEXT    | NOT NULL                                                          | 料理名                       |
| category   | TEXT    | NOT NULL, `beef` / `pork` / `chicken` / `fish` / `side` / `other` | 牛／豚／鳥／魚／副菜／その他 |
| tiktok_url | TEXT    | NULL 可                                                           | TikTok リンク                |
| memo       | TEXT    | NULL 可                                                           | メモ                         |
| created_at | INTEGER | NOT NULL                                                          | 作成日時（UNIX ミリ秒）      |
| updated_at | INTEGER | NOT NULL                                                          | 更新日時（UNIX ミリ秒）      |

### ingredients（材料）

| カラム    | 型      | 制約                                        | 内容                                    |
| --------- | ------- | ------------------------------------------- | --------------------------------------- |
| id        | INTEGER | PK, 自動採番                                |                                         |
| recipe_id | INTEGER | NOT NULL, FK → recipes.id, 削除時カスケード |                                         |
| position  | INTEGER | NOT NULL                                    | レシピ内の並び順（0 始まり）            |
| name      | TEXT    | NOT NULL                                    | 材料名                                  |
| quantity  | REAL    | NULL 可                                     | 数量。単位が「適量」「少々」のとき NULL |
| unit      | TEXT    | NOT NULL                                    | 単位（下記の選択肢）                    |

- インデックス：`ingredients(recipe_id, position)`
- レシピ更新時は、そのレシピの材料をすべて削除して入れ直す（D1 の batch で 1 トランザクション）

### 単位の選択肢

`g`、`ml`、`個`、`本`、`枚`、`切れ`、`尾`、`束`、`株`、`玉`、`片`、`袋`、`パック`、`缶`、`cm`、`カップ`、`大さじ`、`小さじ`、`適量`、`少々`

- 数量なしの単位：`適量`、`少々`
- 単位の換算（kg → g、大さじ → ml など）はしない

## 2. API

すべて JSON。認証なし。

| メソッド | パス               | 内容                                 | 主なレスポンス           |
| -------- | ------------------ | ------------------------------------ | ------------------------ |
| GET      | `/api/recipes`     | 全レシピ（材料込み）を新しい順で返す | 200 `Recipe[]`           |
| GET      | `/api/recipes/:id` | 1 件取得                             | 200 `Recipe` / 404       |
| POST     | `/api/recipes`     | 登録                                 | 201 `Recipe` / 400       |
| PUT      | `/api/recipes/:id` | 更新（材料は丸ごと置き換え）         | 200 `Recipe` / 400 / 404 |
| DELETE   | `/api/recipes/:id` | 削除                                 | 204 / 404                |

```ts
type Category = "beef" | "pork" | "chicken" | "fish" | "side" | "other";

type Ingredient = {
  name: string; // 1〜50 文字、前後の空白は除去
  quantity: number | null; // 0 より大きい。単位が適量・少々なら null
  unit: Unit;
};

type Recipe = {
  id: number;
  title: string; // 1〜100 文字
  category: Category;
  tiktokUrl: string | null; // http(s) の URL
  memo: string | null; // 〜1000 文字
  ingredients: Ingredient[]; // 1 件以上
  createdAt: number;
  updatedAt: number;
};
```

- 入力チェックは Zod スキーマを画面と API で共有する
- 材料名の入力候補は API を増やさず、取得済みの全レシピから画面側で作る

## 3. 画面側の状態

| 状態         | 保存先                              | 内容                               |
| ------------ | ----------------------------------- | ---------------------------------- |
| 選択中の料理 | localStorage（`selectedRecipeIds`） | レシピ ID の配列（選択した順）     |
| カテゴリタブ | URL のクエリ（`?c=pork`）           | 戻ったときにタブを保持             |
| レシピデータ | メモリ                              | 画面表示時に `/api/recipes` を取得 |

- 削除済みのレシピ ID が選択に残っていたら無視し、保存し直す

## 4. 材料の合算ロジック

入力：選択中のレシピ（選択順）。出力：材料一覧の行。

1. 選択順にレシピを走査し、各レシピの材料を並び順に処理する
2. 材料名（前後の空白除去）ごとに 1 行にまとめる。行の順は材料名が最初に出てきた順
3. 行の中では単位ごとに数量を合計する。単位の順も最初に出てきた順
4. `適量`・`少々` は数量を持たず、単位名だけを 1 回表示する
5. 数量は小数第 2 位で丸め、末尾の 0 は表示しない（1.50 → 1.5）

表示例：

```
鶏もも肉 550g
玉ねぎ 1個 + 100g
醤油 大さじ3
塩 少々
```

- 数値の後ろに付ける単位（g、ml、個…）と、前に付ける単位（大さじ、小さじ、カップ）を区別する
- コピーされるテキストも表示と同じ形式

## 5. ファイル構成

```
recipe-list/
├─ docs/                     要件・画面・技術・設計
├─ index.html                画面のエントリ
├─ public/                   アイコン（PWA）
├─ src/
│  ├─ client/                画面（Preact）
│  │  ├─ main.tsx            起動処理
│  │  ├─ app.tsx             ルーティング
│  │  ├─ pages/
│  │  │  ├─ RecipeListPage.tsx     S1 レシピ一覧
│  │  │  ├─ IngredientsPage.tsx    S2 材料一覧
│  │  │  ├─ RecipeDetailPage.tsx   S3 レシピ詳細
│  │  │  └─ RecipeFormPage.tsx     S4 登録・編集
│  │  ├─ components/         共通部品
│  │  ├─ lib/
│  │  │  ├─ api.ts           API クライアント（fetch）
│  │  │  └─ selection.ts     選択状態（localStorage）
│  │  └─ styles.css
│  ├─ server/                API（Hono）
│  │  ├─ index.ts            Worker のエントリ、ルート定義
│  │  └─ db/schema.ts        Drizzle のテーブル定義
│  └─ shared/                画面と API で共有
│     ├─ recipe.ts           Zod スキーマ、型、カテゴリ
│     ├─ units.ts            単位の定義
│     ├─ aggregate.ts        材料の合算
│     └─ aggregate.test.ts
├─ drizzle/                  マイグレーション SQL
├─ wrangler.jsonc            Cloudflare 設定（D1 の紐付け）
├─ vite.config.ts
├─ drizzle.config.ts
├─ biome.json
├─ tsconfig.json
└─ package.json
```
