import { registerSW } from "virtual:pwa-register";
import { render } from "preact";
import { App } from "./app";
import "./styles.css";

const root = document.getElementById("app");
if (root) render(<App />, root);

// ホーム画面から開いたアプリは起動時にしか更新を確認しないため、
// アプリに戻ってきたときにも新しいバージョンを確認する（見つかれば自動で再読み込みされる）
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") registration.update().catch(() => {});
    });
  },
});
