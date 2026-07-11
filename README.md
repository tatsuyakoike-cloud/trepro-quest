# トレプロクエスト

新卒メンバー（浅井さん・中岫さん）のオンボーディング進捗を、8bit JRPG風UIで管理するWebアプリです。

## 使用技術

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- Zustand
- Supabase（Auth / Database / RLS）
- GitHub Pages + GitHub Actions

## ローカル起動

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで http://localhost:5173/trepro-quest/ を開きます。

### デモモード（Supabase未設定時）

`.env.local` に Supabase の値を設定しない場合、ローカルストレージで動作するデモモードになります。

| ロール | メール | パスワード |
|--------|--------|-----------|
| 管理者 | admin@trepro.jp | trepro2026 |
| 審査者 | koike@trepro.jp | trepro2026 |
| メンバー | asai@trepro.jp | trepro2026 |

ログイン画面のクイックボタンからもロールを切り替えられます。

## Supabase 初期設定

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. SQL Editor で以下の順に実行:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
   - `supabase/rls.sql`
3. Authentication > Users でユーザーを作成
4. 各ユーザーの `profiles` テーブルで `role` と `member_slug` を設定

### 環境変数

`.env.local` に設定:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

## ビルド確認

```bash
npm run build
npm run preview
```

## GitHub Pages 公開手順

1. GitHub に `trepro-quest` リポジトリを作成して push
2. Settings > Pages > Source を **GitHub Actions** に設定
3. Settings > Secrets and variables > Actions に以下を登録:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. `main` ブランチへ push すると自動デプロイされます

公開URL: `https://<username>.github.io/trepro-quest/`

## 画面構成

| 画面 | パス | 説明 |
|------|------|------|
| ログイン | `/login` | メール＋パスワード認証 |
| ワールド | `/` | 浅井さん・中岫さんの進捗ダッシュボード |
| クエスト | `/members/:slug` | メンバー別ミッション一覧・編集 |
| 管理 | `/admin` | テーブル/カード表示・絞り込み |

## 権限

| ロール | 閲覧 | 編集 |
|--------|------|------|
| admin | 全件 | 全件 |
| reviewer | 全件 | 進捗・合否・フィードバック |
| member | 自分のみ | ステータス・TLDB・コメント（合否不可） |

## よくあるエラー

| エラー | 対処 |
|--------|------|
| 白い画面 | `base: '/trepro-quest/'` のパスが正しいか確認 |
| ログインできない | Supabase Auth の Email 設定を確認 |
| データが表示されない | seed.sql が実行済みか確認 |
| ビルド失敗 | `npm ci && npm run build` でローカル再現 |

## 今後の拡張案

- スマートフォン対応
- Slack / メール通知
- メンバー・ミッション追加UI
- スプレッドシート連携
- AIフィードバック要約
