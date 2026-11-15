-- カテゴリを 肉系/魚系/副菜 → 牛/豚/鳥/魚/副菜/その他 に変更する。
-- CHECK 制約を変えるため recipes を作り直す。D1 ではマイグレーション中に
-- foreign_keys=OFF が効かず、DROP TABLE recipes で ingredients が CASCADE 削除されるため、
-- ingredients を退避して戻す。
PRAGMA defer_foreign_keys = on;--> statement-breakpoint
CREATE TABLE `__new_recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`tiktok_url` text,
	`memo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "recipes_category_check" CHECK("__new_recipes"."category" in ('beef', 'pork', 'chicken', 'fish', 'side', 'other'))
);
--> statement-breakpoint
INSERT INTO `__new_recipes`("id", "title", "category", "tiktok_url", "memo", "created_at", "updated_at")
SELECT "id", "title", CASE "category" WHEN 'meat' THEN 'other' ELSE "category" END, "tiktok_url", "memo", "created_at", "updated_at" FROM `recipes`;--> statement-breakpoint
CREATE TABLE `__ingredients_backup` AS SELECT * FROM `ingredients`;--> statement-breakpoint
DROP TABLE `recipes`;--> statement-breakpoint
ALTER TABLE `__new_recipes` RENAME TO `recipes`;--> statement-breakpoint
DELETE FROM `ingredients`;--> statement-breakpoint
INSERT INTO `ingredients` SELECT * FROM `__ingredients_backup`;--> statement-breakpoint
DROP TABLE `__ingredients_backup`;--> statement-breakpoint
PRAGMA defer_foreign_keys = off;
