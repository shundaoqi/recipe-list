# レシピリストアプリ 技術構成 v1.0

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
| PWA                | vite-plugin-pwa                    | ホーム画面への追加（manifest、アイコン）   |
| テスト             | Vitest                             | 材料の合算処理など                         |
| 整形・静的チェック | Biome                              | フォーマット、lint                         |
| パッケージ管理     | npm                                |                                            |
| Cloudflare 操作    | wrangler                           | D1 作成、マイグレーション、デプロイ        |
| 実行環境（手元）   | Node.js 24 以上                    |                                            |

使わないもの：データ取得ライブラリ（TanStack Query 等）、オフライン対応、認証。

## 3. ソース管理

- GitHub：https://github.com/shundaoqi/recipe-list （非公開）
- `main` ブランチ ＝ 本番

## 4. デプロイ

### 初回（手動）

1. `wrangler login` で Cloudflare にログイン
2. `wrangler d1 create recipe-list` で本番 D1 を作成し、ID を `wrangler.jsonc` に記入
3. `npm run deploy` で公開

### 2 回目以降（Workers Builds による自動デプロイ）

- Cloudflare 管理画面で Worker と GitHub リポジトリを連携する
- `main` に push すると Cloudflare 側で自動的にビルド・公開される

| 設定             | 値               |
| ---------------- | ---------------- |
| ビルドコマンド   | `npm run build`  |
| デプロイコマンド | `npm run deploy` |

`npm run deploy` は次を順に実行する：

1. `wrangler d1 migrations apply recipe-list --remote`（テーブル変更を本番 D1 に反映）
2. `wrangler deploy`（Worker を公開）

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

## 6. 開発の流れ

1. `npm run dev` で手元に画面・API・ローカル D1 を起動して確認
2. `npm run test` / `npm run check` でテストと静的チェック
3. `main` に push → 自動デプロイ
