# レシピリストアプリ 技術構成 v1.1

要件は [requirements.md](requirements.md)、画面は [screens.md](screens.md) を参照。

## 1. 全体構成

```
スマホ（ブラウザ / ホーム画面から起動）
   │
   ▼
Cloudflare Workers（1 つの Worker）
 ├─ 画面ファイルの配信（Vite でビルドした静的ファイル）
 ├─ /api/*  … Hono
 └─ D1（SQLite）… レシピを保存
```

- 無料プランの範囲で運用する
- ログイン・アクセス制限なし
- オフライン対応なし

## 2. 採用技術

| 分類               | 採用                               | 用途                                       |
| ------------------ | ---------------------------------- | ------------------------------------------ |
| 言語               | TypeScript                         | 画面・API 共通                             |
| 画面               | Preact                             | UI 部品                                    |
| 画面の切り替え     | preact-iso                         | URL ごとの画面切り替え                     |
| CSS                | Tailwind CSS                       | スタイリング                               |
| 開発・ビルド       | Vite ＋ @cloudflare/vite-plugin    | 手元で画面・API・D1 をまとめて起動、ビルド |
| API                | Hono ＋ Zod（@hono/zod-validator） | ルーティング、入力チェック                 |
| 画面 ↔ API         | fetch ＋ 共有の型（src/shared）    | 画面と API で型・入力チェックを共有        |
| DB                 | Cloudflare D1 ＋ Drizzle ORM       | 型付きの読み書き、マイグレーション管理     |
| PWA                | vite-plugin-pwa                    | ホーム画面への追加、画面ファイルの更新     |
| テスト             | Vitest                             | 材料の合算処理など                         |
| 整形・静的チェック | Biome                              | フォーマット、lint                         |
| パッケージ管理     | npm                                |                                            |
| Cloudflare 操作    | wrangler                           | D1 作成、マイグレーション、デプロイ        |
| 実行環境（手元）   | Node.js 24 以上                    |                                            |

使わないもの：データ取得ライブラリ（TanStack Query 等）、オフライン対応、認証。

## 3. ソース管理

- GitHub：https://github.com/shundaoqi/recipe-list （非公開）
- 本番 URL：https://recipe-list.shundaoqi.workers.dev
- `main` ブランチ ＝ 本番
- 個人のリポジトリなので、会社のアカウント・メールアドレスと混ぜない
  - コミットの作成者はリポジトリ単位の設定（`git config user.name` / `user.email`）で個人のものにしている
  - push はリポジトリ単位の credential helper で、常に shundaoqi のトークン（`gh auth token -u shundaoqi`）を使う。GitHub CLI で有効なアカウントが会社用でも push できる

## 4. デプロイ

### 初回（手動、実施済み）

1. `wrangler login` で Cloudflare（個人アカウント）にログイン
2. `wrangler d1 create recipe-list` で本番 D1 を作成し、ID を `wrangler.jsonc` に記入
3. `npm run deploy` で公開

Cloudflare アカウントのメールアドレスが未確認だと、Worker の公開がエラーになる（code: 10034）。

### 2 回目以降（Workers Builds による自動デプロイ）

- Cloudflare 管理画面で Worker と GitHub リポジトリを連携する
- `main` に push すると Cloudflare 側で自動的にビルド・公開される

| 設定             | 値               |
| ---------------- | ---------------- |
| ビルドコマンド   | `npm run build`  |
| デプロイコマンド | `npm run deploy` |

設定場所：Cloudflare 管理画面 → Workers & Pages → recipe-list → Settings → Build

`npm run deploy` は次を順に実行する：

1. `wrangler d1 migrations apply recipe-list --remote`（テーブル変更を本番 D1 に反映）
2. `wrangler deploy`（Worker を公開）

**デプロイコマンドは必ず `npm run deploy` にする。** 初期値の `npx wrangler deploy` のままだとマイグレーションが実行されず、新しいコードが古いテーブルで動いてしまう（2026-11-15 に発生）。

GitHub 側は「Cloudflare Workers and Pages」アプリに `recipe-list` リポジトリだけを許可している（GitHub → Settings → Applications → Installed GitHub Apps）。

### workers.dev サブドメインの変更

本番 URL は `<Worker 名>.<アカウントのサブドメイン>.workers.dev` で、現在は `recipe-list.shundaoqi.workers.dev`（2026-11-15 に `recipe-list.recipe-list.workers.dev` から変更）。アカウントのサブドメインを変えると URL が `recipe-list.<新サブドメイン>.workers.dev` に変わる。

- コードの変更は不要（API は相対パス `/api` で呼んでおり、URL を書いた設定もない）
- D1・Workers Builds（自動デプロイ）・GitHub 連携は影響を受けない
- 旧 URL から新 URL への転送はなく、旧 URL は使えなくなる

手順：

1. Cloudflare 管理画面 → Workers & Pages → 右側の「Subdomain」で変更する
   - アカウント内のすべての Worker の URL が変わる
   - 反映まで数分〜しばらくかかることがある。変更直後は新 URL の証明書がまだなく、開くと SSL エラーになる
2. 新 URL でレシピ一覧が表示され、追加・編集できることを確認する
3. `README.md` と本ファイル（「3. ソース管理」）の本番 URL を書き換えて `main` に push する
4. 2 人のスマホで次を行う
   - ホーム画面の旧アプリを削除し、新 URL を開いて「ホーム画面に追加」し直す（ホーム画面のアプリは旧 URL を開くため）
   - ブラウザのブックマークがあれば新 URL に変える
   - 材料一覧で選んでいた料理は URL ごとにブラウザに保存しているため引き継がれない。選び直す（レシピ自体は D1 にあるので消えない）

## 5. テーブル構成の管理

- 正本は `src/server/db/schema.ts`（Drizzle のテーブル定義）
- 変更手順：
  1. `schema.ts` を編集
  2. `npm run db:generate` で `drizzle/` にマイグレーション SQL を生成
  3. `npm run db:migrate:local` で手元の D1 に反映して確認
  4. `main` に push → デプロイ時に本番 D1 へ自動反映（適用済みのファイルは D1 側で記録され、再実行されない）
- ルール：
  - 本番に適用済みのマイグレーションファイルは編集しない。修正は新しいファイルで行う
  - 列・テーブルの削除などデータが消える変更は事前に確認する
  - 本番 D1 の構成を管理画面や手動 SQL で直接変更しない
- テーブルを作り直す変更（CHECK 制約の変更など）の注意：
  - drizzle-kit が生成する `PRAGMA foreign_keys=OFF` は D1 のマイグレーション中は効かない。代わりに `PRAGMA defer_foreign_keys = on` を使う
  - `recipes` を DROP すると `ingredients` が CASCADE で消えるため、`ingredients` を一時テーブルに退避して戻す（`drizzle/0001_categories.sql` を参照）
  - 本番に入れる前に、データの入ったローカル D1 で件数が変わらないことを確認する
- ローカル D1 のファイルは `wrangler.jsonc` の `database_id` ごとに作られる（`.wrangler/state/v3/d1/`）

## 6. 開発の流れ

1. `npm run dev` で手元に画面・API・ローカル D1 を起動して確認
2. `npm test` / `npm run check` でテストと静的チェック
3. `main` に push → 約 1 分で自動デプロイ
4. スマホのホーム画面のアプリは、開き直すと新しいバージョンになる

### npm の注意

- npm 11 は依存パッケージのインストールスクリプトを既定で実行しない。必要な esbuild・workerd は `package.json` の `allowScripts` で許可している
- これらのバージョンが変わると許可し直しが必要（`npm install-scripts ls` で確認、`npm install-scripts approve <pkg>` で許可）
