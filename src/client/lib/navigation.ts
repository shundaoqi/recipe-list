// 一覧に戻ったときにカテゴリのタブを保つため、最後に開いた一覧の URL を覚えておく
let lastListUrl = "/";

export function rememberListUrl(url: string) {
  lastListUrl = url;
}

export function listUrl(): string {
  return lastListUrl;
}
