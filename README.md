# トレプロクエスト

新卒メンバー（浅井さん・中岫さん）のオンボーディング進捗を、8bit JRPG風UIで管理するWebアプリです。

**マスターデータは Google スプレッドシートで管理**し、シートを編集するとUIにも反映されます。

## マスターデータ（スプレッドシート）

https://docs.google.com/spreadsheets/d/12qHhMQB7DsYZauA64slzs3ABaMcJYMPWivMYgWzqESM/edit

| シート | 内容 |
|--------|------|
| ユーザー | ログインアカウント |
| メンバー | 浅井さん・中岫さん |
| ミッション | カリキュラム・合格条件 |
| 進捗 | 各Stepのステータス・合否 |
| 称号 | レベル別称号 |
| ダッシュボード | 全体サマリー（自動更新） |

セットアップ手順: [docs/google-sheets/SHEET_SETUP.md](docs/google-sheets/SHEET_SETUP.md)

## ログインアカウント

| ロール | メール | パスワード | 見える範囲 |
|--------|--------|-----------|-----------|
| 管理者 | support-team@tre-pro.co.jp | trepro2026 | 全員 |
| 浅井さん | asai@tre-pro.co.jp | asai2026 | 自分のみ |
| 中岫さん | nakaguki@tre-pro.co.jp | nakakuki2026 | 自分のみ |

## ローカル起動

```bash
npm install
cp .env.example .env.local
npm run dev
```

## スプレッドシート連携

1. Apps Script を設置（`docs/google-sheets/apps-script/Code.gs`）
2. `setupMasterData` を実行
3. ウェブアプリとしてデプロイ
4. `public/config.json` の `syncApiUrl` にデプロイURLを設定

`syncApiUrl` 未設定時はローカルデータで動作します（開発用）。本番では必ず Apps Script の URL を設定してください。

画面上部のバッジで連携状態を確認できます:
- **シート連携**（緑）: スプレッドシートと双方向同期中
- **ローカル**（黄）: ブラウザ内のみ（未連携）

## 公開URL

https://tatsuyakoike-cloud.github.io/trepro-quest/

## 使用技術

- React + Vite + TypeScript + Tailwind CSS
- Google スプレッドシート + Apps Script
- GitHub Pages
