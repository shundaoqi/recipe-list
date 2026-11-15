# recipe-list

2 人で共有するレシピリスト。料理を選ぶと材料を合算して一覧にし、コピーできる。

- 要件：[docs/requirements.md](docs/requirements.md)
- 画面：[docs/screens.md](docs/screens.md)
- 技術構成・デプロイ：[docs/tech-stack.md](docs/tech-stack.md)
- 設計（テーブル・API）：[docs/design.md](docs/design.md)

構成：Cloudflare Workers（Hono）＋ D1（Drizzle）＋ Preact ＋ Tailwind CSS

本番：https://recipe-list.shundaoqi.workers.dev （`main` に push すると自動デプロイ）

## 開発

```sh
npm install
npm run db:migrate:local   # 手元の D1 にテーブルを作る（初回・テーブル変更時）
npm run dev                # http://localhost:5173
```

| コマンド              | 内容                                                            |
| --------------------- | --------------------------------------------------------------- |
| `npm test`            | テスト（材料の合算など）                                        |
| `npm run check`       | Biome（lint・整形チェック）と型チェック                         |
| `npm run format`      | Biome で整形                                                    |
| `npm run db:generate` | `src/server/db/schema.ts` の変更からマイグレーション SQL を生成 |
| `npm run build`       | 本番ビルド                                                      |
| `npm run deploy`      | 本番 D1 にマイグレーションを適用し、Worker を公開               |
| `npm run cf-typegen`  | `wrangler.jsonc` から Worker の型を生成                         |
