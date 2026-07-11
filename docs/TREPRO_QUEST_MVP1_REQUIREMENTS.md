# トレプロクエスト 第1 MVP 要件定義書

| 項目 | 内容 |
|------|------|
| ドキュメント版 | v1.0.0 |
| 対象フェーズ | 第1 MVP |
| 最終更新 | 2026-07-11 |
| 想定読者 | 第三者の AI 開発者・エンジニア |

---

## 目次

1. [最上位目的](#1-最上位目的)
2. [第1 MVP のスコープ](#2-第1-mvp-のスコープ)
3. [ユーザーとロール](#3-ユーザーとロール)
4. [機能要件](#4-機能要件)
5. [画面仕様](#5-画面仕様)
6. [データ設計](#6-データ設計)
7. [認証・権限](#7-認証権限)
8. [ミッション・カリキュラム設計](#8-ミッションカリキュラム設計)
9. [レベル・称号システム](#9-レベル称号システム)
10. [スプレッドシート連携 API](#10-スプレッドシート連携-api)
11. [同期モード](#11-同期モード)
12. [技術スタック](#12-技術スタック)
13. [プロジェクト構成](#13-プロジェクト構成)
14. [実装手順（ゼロから公開まで）](#14-実装手順ゼロから公開まで)
15. [Google スプレッドシート セットアップ](#15-google-スプレッドシート-セットアップ)
16. [Apps Script セットアップ](#16-apps-script-セットアップ)
17. [GitHub Pages デプロイ](#17-github-pages-デプロイ)
18. [テスト計画](#18-テスト計画)
19. [既知の制約・将来課題](#19-既知の制約将来課題)
20. [付録](#20-付録)

---

## 1. 最上位目的

### 1.1 ミッション（Why）

**新卒メンバーが「現場で戦える仲間」になるまでの育成進捗を、可視化・共有・更新できる仕組みを提供する。**

具体的には以下を実現する。

- 管理者（サポートチーム）が **全メンバーの進捗を一覧で把握** できる
- 新卒メンバーが **自分のクエスト（研修ステップ）の状況を確認** できる
- 進捗データの **マスターは Google スプレッドシート** とし、UI と双方向同期する
- 8bit JRPG 風 UI で、研修の進捗を「冒険の記録」として **モチベーションを維持** しやすくする

### 1.2 第1 MVP で達成すべきこと

| # | 達成目標 |
|---|----------|
| G1 | 管理者・新卒がログインし、権限に応じた画面だけを見られる |
| G2 | 商談ロープレ / 資料作成 の2軸でクエスト進捗を管理できる |
| G3 | UI で進捗を編集するとスプレッドシートに反映される |
| G4 | スプレッドシートを直接編集すると UI に反映される |
| G5 | GitHub Pages で公開し、ブラウザから誰でも URL アクセスできる |
| G6 | 第三者 AI 開発者が本ドキュメントのみで再実装・公開できる |

### 1.3 第1 MVP でやらないこと（Non-Goals）

- Supabase / PostgreSQL 等の本格 RDB 連携（コード残骸は存在するが未使用）
- 審査者（reviewer）ロール
- メンバーの動的追加（コード上は2名固定）
- パスワードのハッシュ化・OAuth・SSO
- メール通知・Slack 連携
- モバイルネイティブアプリ
- 多言語対応

---

## 2. 第1 MVP のスコープ

### 2.1 システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages（静的 SPA）                    │
│  React + Vite + TypeScript + Tailwind + Zustand              │
│  URL: https://{user}.github.io/trepro-quest/                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ fetch (GET/POST)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Apps Script（Web App API）                 │
│  doGet: ping / fetchAll                                      │
│  doPost: login / updateProgress                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ SpreadsheetApp API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Google スプレッドシート（マスターDB）              │
│  ユーザー / メンバー / ミッション / 進捗 / 称号 / ダッシュボード  │
└─────────────────────────────────────────────────────────────┘

フォールバック: syncApiUrl 未設定 or API 未到達時 → localStorage
```

### 2.2 対象ユーザー

| ペルソナ | ロール | 人数（MVP） |
|----------|--------|-------------|
| サポートチーム（管理者） | admin | 1 |
| 浅井さん（新卒） | member | 1 |
| 中岫さん（新卒） | member | 1 |

---

## 3. ユーザーとロール

### 3.1 ユーザーストーリー

**管理者（admin）**

- 全メンバーの進捗をタブ別・マトリクス形式で一覧したい
- 各クエストのステータス・合否を編集したい
- スプレッドシートのマスターデータへワンクリックで遷移したい
- KPI（審査待ち・期限超過等）を俯瞰したい

**新卒メンバー（member）**

- 自分のクエスト進捗だけを見たい
- 自分のステータス（未着手〜完了）を更新したい
- 合格条件を確認しながら次のクエストに進みたい
- レベルアップ時に JRPG 風の演出で達成感を得たい

### 3.2 初期アカウント

| ロール | 表示名 | メール | パスワード | member_slug |
|--------|--------|--------|-----------|-------------|
| admin | 管理者 | support-team@tre-pro.co.jp | trepro2026 | （空） |
| admin（エイリアス） | 管理者 | admin@trepro.jp | trepro2026 | （空） |
| member | 浅井さん | asai@tre-pro.co.jp | asai2026 | asai |
| member | 中岫さん | nakaguki@tre-pro.co.jp | nakakuki2026 | nakakuki |

---

## 4. 機能要件

### 4.1 認証（FR-AUTH）

| ID | 要件 | 優先度 |
|----|------|--------|
| FR-AUTH-01 | メール + パスワードでログインできる | 必須 |
| FR-AUTH-02 | ログイン状態は sessionStorage に保持する | 必須 |
| FR-AUTH-03 | ログアウトで sessionStorage をクリアする | 必須 |
| FR-AUTH-04 | admin ログイン後は `/admin` に遷移する | 必須 |
| FR-AUTH-05 | member ログイン後は `/members/{slug}` に遷移する | 必須 |
| FR-AUTH-06 | API 未到達時も組み込みアカウントでログインできる | 必須 |
| FR-AUTH-07 | API 到達時はシート上のユーザー情報をプロフィールに利用できる | 推奨 |

### 4.2 進捗管理（FR-PROGRESS）

| ID | 要件 | 優先度 |
|----|------|--------|
| FR-PROGRESS-01 | 6 つのクエスト（Step）の進捗を管理する | 必須 |
| FR-PROGRESS-02 | ステータス: 未着手/準備中/実施中/審査待ち/再挑戦/完了 | 必須 |
| FR-PROGRESS-03 | 合否: 未審査/合格/不合格 | 必須 |
| FR-PROGRESS-04 | 実施日・フィードバック・次回アクション・期限・TLDB URL を記録 | 必須 |
| FR-PROGRESS-05 | admin のみ合否（result）を変更できる | 必須 |
| FR-PROGRESS-06 | member は自分の進捗のみ編集できる | 必須 |
| FR-PROGRESS-07 | 合格時はフィードバック必須、不合格時は次回アクション+期限必須 | 必須 |
| FR-PROGRESS-08 | 保存時にレベルアップ判定し、演出を表示する | 必須 |

### 4.3 管理者画面（FR-ADMIN）

| ID | 要件 | 優先度 |
|----|------|--------|
| FR-ADMIN-01 | KPI 6種を表示（全Step数/合格数/審査待ち/再挑戦/今週完了/期限超過） | 必須 |
| FR-ADMIN-02 | 「商談ロープレ」「資料作成」タブ切替 | 必須 |
| FR-ADMIN-03 | タブ別メンバーサマリー（進捗率）を表示 | 必須 |
| FR-ADMIN-04 | クエスト×メンバーのマトリクス表で全員進捗を一覧 | 必須 |
| FR-ADMIN-05 | 各セルから編集モーダルを開ける | 必須 |
| FR-ADMIN-06 | スプレッドシートへの外部リンク（マスター） | 必須 |
| FR-ADMIN-07 | 要件定義書 MD のダウンロードボタン | 必須 |

### 4.4 メンバー画面（FR-MEMBER）

| ID | 要件 | 優先度 |
|----|------|--------|
| FR-MEMBER-01 | レベル・称号・合格数・総合進捗を表示 | 必須 |
| FR-MEMBER-02 | 「商談ロープレ」「資料作成」タブ切替 | 必須 |
| FR-MEMBER-03 | セクション別にクエストカードを表示 | 必須 |
| FR-MEMBER-04 | 資料作成タブに「レベル上げ」サマリーカード | 必須 |
| FR-MEMBER-05 | 次のクエスト（未完了の最初の Step）を表示 | 推奨 |

### 4.5 同期（FR-SYNC）

| ID | 要件 | 優先度 |
|----|------|--------|
| FR-SYNC-01 | syncApiUrl 設定時、15秒間隔でシートから自動取得 | 必須 |
| FR-SYNC-02 | タブ復帰時（visibilitychange）に再取得 | 必須 |
| FR-SYNC-03 | 手動更新ボタンで即時同期 | 必須 |
| FR-SYNC-04 | UI 保存 → 進捗シート書き込み → ダッシュボード再計算 | 必須 |
| FR-SYNC-05 | シート直接編集 → onEdit トリガーでダッシュボード再計算 | 必須 |
| FR-SYNC-06 | API 未到達時は localStorage にフォールバック | 必須 |
| FR-SYNC-07 | 同期状態をバッジ + バナーで可視化 | 必須 |

---

## 5. 画面仕様

### 5.1 ルーティング

| パス | 画面 | 認証 | 備考 |
|------|------|------|------|
| `/login` | ログイン | 不要 | ログイン済みならリダイレクト |
| `/` | ホーム | 要 | admin→/admin, member→/members/{slug} |
| `/admin` | 進捗管理 | admin のみ | |
| `/members/:slug` | 冒険の記録 | 要 | slug: asai / nakakuki |

`BrowserRouter` の `basename`: `/trepro-quest`

### 5.2 共通ヘッダー（AppLayout）

| 要素 | admin | member |
|------|-------|--------|
| ロゴ | トレプロクエスト → /admin or /members/{slug} | 同左 |
| ナビ | 進捗管理 / 浅井さん / 中岫さん | 冒険の記録 |
| 同期バッジ | シート連携(緑) / 接続エラー(赤) / ローカル(黄) | 同左 |
| マスターリンク | スプレッドシート外部リンク | 非表示 |
| ユーザー名 + ロール | 表示 | 表示 |
| 終了ボタン | ログアウト | 同左 |

### 5.3 ログイン画面

- タイトル: トレプロクエスト
- サブタイトル: 現場で戦える仲間になるための育成記録
- フォーム: メールアドレス、パスワード
- ボタン: 冒険をはじめる
- エラー: フォーム下に赤文字

### 5.4 管理者画面（/admin）

**構成（上から順）**

1. タイトル「進捗管理」+ 説明文
2. KPI カード 6 個（2列×3列 or 6列グリッド）
3. タブ: 商談ロープレ / 資料作成
4. PixelWindow「{タブ} — メンバー別サマリー」
5. セクションごとのコンテンツ:
   - 商談ロープレ: 商談ロープレのレベル上げ（マトリクス表）
   - 資料作成: レベル上げ（メンバー別 CategoryLevelCard）→ 事例一覧 → 競合調査 → 提案資料のレベル上げ（各マトリクス表）
6. フッター: 要件定義書ダウンロードボタン

**マトリクス表の列**: クエスト | 浅井さん | 中岫さん

**セル内容**: StatusBadge + ResultBadge + 実施日 + 期限 + 編集ボタン

### 5.5 メンバー画面（/members/:slug）

**構成（上から順）**

1. PixelWindow「{名前}の冒険記録」
   - レベル、称号、合格数、最終更新
   - 総合進捗バー（HPバー風）
   - 審査待ち数、再挑戦数
2. タブ: 商談ロープレ / 資料作成
3. セクション別 QuestCard グリッド
4. 資料作成タブ先頭: CategoryLevelCard（資料作成レベル上げサマリー）

### 5.6 編集モーダル（EditQuestModal）

| フィールド | admin | member | バリデーション |
|-----------|-------|--------|-------------|
| ステータス | ✅ | ✅ | 必須 |
| 合否（result） | ✅ | ❌（非表示） | 合格→feedback必須、不合格→next_action+due_date必須 |
| 実施日 | ✅ | ✅ | |
| フィードバック | ✅ | ✅ | |
| 次回アクション | ✅ | ✅ | |
| 期限 | ✅ | ✅ | |
| TLDB URL | ✅ | ✅ | URL形式 |

### 5.7 UI デザインガイドライン

- **テーマ**: 8bit JRPG / ドット絵風
- **フォント**: DotGothic16（Google Fonts）
- **カラー**:
  - 背景: ダークブルー系（#0a0a1a）
  - アクセント: ゴールド（#f5d742）
  - HPバー: 緑 → 黄 → 赤のグラデーション
- **コンポーネント**: PixelWindow（白枠ウィンドウ）、pixel-btn、pixel-title
- **演出**: レベルアップ時に GameMessage + ★★★

---

## 6. データ設計

### 6.1 エンティティ関係

```
ユーザー(Profile) ── member_slug ──> メンバー(Member)
メンバー(Member) ── 1:N ──> 進捗(MemberProgress) ── N:1 ──> ミッション(Mission)
称号(Title) ←── 合格数から自動算出 ── メンバー.title
ダッシュボード ←── Apps Script 自動集計
```

### 6.2 TypeScript 型定義

```typescript
type UserRole = 'admin' | 'member'

type ProgressStatus = '未着手' | '準備中' | '実施中' | '審査待ち' | '再挑戦' | '完了'
type ProgressResult = '未審査' | '合格' | '不合格'

interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  member_slug: string | null
  created_at: string
  updated_at: string
}

interface Member {
  id: string
  name: string
  slug: string
  title: string
  active: boolean
  created_at: string
  updated_at: string
}

interface Mission {
  id: string
  tab: string                    // '商談ロープレ' | '資料作成'
  mission_group: string
  step_number: number
  level_name: string             // 'Lv.1' 等
  title: string
  description: string
  reviewer_name: string
  pass_criteria: string          // パイプ区切り
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

interface MemberProgress {
  id: string
  member_id: string
  mission_id: string
  status: ProgressStatus
  result: ProgressResult
  executed_at: string | null
  feedback: string
  next_action: string
  due_date: string | null
  tldb_url: string
  updated_by: string | null
  created_at: string
  updated_at: string
}
```

### 6.3 スプレッドシート列定義

#### シート: ユーザー

| 列名 | 型 | 例 |
|------|-----|-----|
| id | string | admin-001 |
| name | string | 管理者 |
| email | string | support-team@tre-pro.co.jp |
| password | string | trepro2026 |
| role | string | admin |
| member_slug | string | （adminは空） |
| active | boolean | TRUE |

#### シート: メンバー

| 列名 | 型 | 例 |
|------|-----|-----|
| id | string | 11111111-1111-1111-1111-111111111101 |
| name | string | 浅井さん |
| slug | string | asai |
| title | string | 旅立ち前の新人 |
| active | boolean | TRUE |

#### シート: ミッション

| 列名 | 型 | 例 |
|------|-----|-----|
| id | string | m-001 |
| tab | string | 商談ロープレ |
| mission_group | string | 商談ロープレのレベル上げ |
| step_number | number | 1 |
| level_name | string | Lv.1 |
| title | string | 基本営業ロープレ |
| description | string | （説明文） |
| reviewer_name | string | 小池 |
| pass_criteria | string | 条件1\|条件2\|条件3 |
| sort_order | number | 1 |
| active | boolean | TRUE |

#### シート: 進捗

| 列名 | 型 | 例 |
|------|-----|-----|
| id | string | asai-m-001 |
| member_slug | string | asai |
| mission_id | string | m-001 |
| status | string | 未着手 |
| result | string | 未審査 |
| executed_at | date/string | |
| feedback | string | |
| next_action | string | |
| due_date | date/string | |
| tldb_url | string | |
| updated_by | string | |
| updated_at | ISO8601 | |

#### シート: 称号

| level | title |
|-------|-------|
| 0 | 旅立ち前の新人 |
| 1 | 見習い冒険者 |
| 2 | 商談のたまご |
| 3 | 提案の戦士 |
| 4 | 現場の実践者 |
| 5 | 即戦力候補 |
| 6 | トレプロ勇者 |

#### シート: ダッシュボード（自動更新・読み取り専用）

| メンバー | 総合レベル | 総合進捗 | 商談ロープレ | 資料作成 | 要フォロー |

---

## 7. 認証・権限

### 7.1 権限マトリクス

| 操作 | admin | member（自分） | member（他人） |
|------|-------|----------------|----------------|
| /admin アクセス | ✅ | ❌ | ❌ |
| メンバー画面閲覧 | 全員 | 自分のみ | ❌ |
| 進捗編集 | 全員 | 自分のみ | ❌ |
| 合否（result）変更 | ✅ | ❌ | ❌ |
| スプレッドシートリンク | ✅ | ❌ | ❌ |

### 7.2 認証フロー

```
1. validateLocalCredentials(email, password)  // 組み込みアカウント（常に実行）
2. 失敗 → エラー返却
3. 成功 → syncApiUrl 設定 かつ ping 成功なら loginViaApi
4. API プロフィール取得できればそれを使用、なければ組み込みプロフィール
5. sessionStorage['trepro-profile'] に JSON 保存
```

---

## 8. ミッション・カリキュラム設計

### 8.1 タブとセクション

```typescript
const TABS = ['商談ロープレ', '資料作成']

const TAB_SECTIONS = {
  '商談ロープレ': ['商談ロープレのレベル上げ'],
  '資料作成': ['レベル上げ', '事例一覧', '競合調査', '提案資料のレベル上げ'],
}

// 資料作成「レベル上げ」に含めるグループ
const DOCUMENT_LEVEL_GROUPS = ['事例一覧', '競合調査', '提案資料のレベル上げ']
```

### 8.2 全6クエスト（初期データ）

| ID | tab | mission_group | Step | タイトル | 審査者 |
|----|-----|---------------|------|----------|--------|
| m-001 | 商談ロープレ | 商談ロープレのレベル上げ | 1 | 基本営業ロープレ | 小池 |
| m-002 | 商談ロープレ | 商談ロープレのレベル上げ | 2 | 実践営業ロープレ | 橋口さん |
| m-003 | 商談ロープレ | 商談ロープレのレベル上げ | 3 | 最終営業ロープレ | 金山さん |
| m-004 | 資料作成 | 事例一覧 | 1 | 最新事例収集 | - |
| m-005 | 資料作成 | 競合調査 | 2 | 競合・業界調査資料更新 | - |
| m-006 | 資料作成 | 提案資料のレベル上げ | 3 | 最新サービス資料の提案反映 | - |

### 8.3 合格条件の記法

`pass_criteria` 列にパイプ `|` 区切りで記載。UI では箇条書き表示。

例:
```
サービス内容を正確に説明できる|敬語や言葉遣いに大きな問題がない|商談の基本的な流れを再現できる
```

---

## 9. レベル・称号システム

### 9.1 ルール

- 総ステップ数: **6**
- レベル = 合格数（最大6、6以上で `Lv.MAX`）
- 進捗率 = `Math.round((合格数 / 6) * 100)`
- 称号は合格数に応じて自動決定

### 9.2 称号テーブル

| 合格数 | レベル表示 | 称号 |
|--------|-----------|------|
| 0 | Lv.0 | 旅立ち前の新人 |
| 1 | Lv.1 | 見習い冒険者 |
| 2 | Lv.2 | 商談のたまご |
| 3 | Lv.3 | 提案の戦士 |
| 4 | Lv.4 | 現場の実践者 |
| 5 | Lv.5 | 即戦力候補 |
| 6+ | Lv.MAX | トレプロ勇者 |

### 9.3 レベルアップ演出

- 保存時に `result` が「合格」かつ合格数が増加 → レベルアップ判定
- `GameMessage` で「レベルが あがった！」+ 新称号を表示
- シート連携時: Apps Script `updateMemberTitles_()` がメンバーシートの title 列を更新

---

## 10. スプレッドシート連携 API

### 10.1 ベース URL

`public/config.json` の `syncApiUrl` に設定する Apps Script Web App URL。

例:
```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

### 10.2 GET エンドポイント（doGet）

| action | 説明 | レスポンス例 |
|--------|------|-------------|
| （なし）/ ping | ヘルスチェック | `{"ok":true,"service":"trepro-quest","updatedAt":"..."}` |
| fetchAll | 全データ取得 | `{"ok":true,"data":{members,missions,progresses,titles},"updatedAt":"..."}` |

### 10.3 POST エンドポイント（doPost）

Content-Type: `text/plain;charset=utf-8`、body は JSON 文字列。

**login**
```json
{
  "action": "login",
  "email": "support-team@tre-pro.co.jp",
  "password": "trepro2026"
}
```
レスポンス: `{"ok":true,"profile":{...}}` （password 除外）

**updateProgress**
```json
{
  "action": "updateProgress",
  "progressId": "asai-m-001",
  "data": {
    "status": "完了",
    "result": "合格",
    "feedback": "よくできました",
    "executed_at": "2026-07-11",
    "next_action": "",
    "due_date": null,
    "tldb_url": "",
    "updated_by": "admin-001"
  }
}
```
レスポンス: `{"ok":true,"progress":{...},"updatedAt":"..."}`

副作用: `updateDashboard_()` + `updateMemberTitles_()` 自動実行

### 10.4 Apps Script 主要関数

| 関数 | 用途 |
|------|------|
| setupMasterData | 初回マスターデータ投入 |
| installTriggers | 進捗シート onEdit トリガー設置 |
| onEdit / onEditProgress_ | シート直接編集時のダッシュボード再計算 |
| updateDashboard_ | ダッシュボードシート更新 |
| updateMemberTitles_ | メンバーシートの称号更新 |

---

## 11. 同期モード

| モード | 条件 | バッジ | 読み取り | 書き込み |
|--------|------|--------|----------|----------|
| local | syncApiUrl 未設定 | ローカル（黄） | localStorage | localStorage |
| sheets | syncApiUrl 設定 + ping 成功 | シート連携（緑） | Apps Script | Apps Script |
| offline | syncApiUrl 設定 + ping 失敗 | 接続エラー（赤） | localStorage | localStorage（警告付き） |

### 双方向同期フロー

```
UI → シート:
  編集保存 → updateProgress API → 進捗シート更新 → ダッシュボード/称号再計算

シート → UI:
  進捗シート直接編集 → onEdit トリガー → ダッシュボード更新
  → 15秒ポーリング or 手動更新 → UI 反映
```

---

## 12. 技術スタック

| カテゴリ | 技術 | バージョン目安 |
|----------|------|---------------|
| フロントエンド | React | 19.x |
| ビルド | Vite | 8.x |
| 言語 | TypeScript | 6.x |
| スタイル | Tailwind CSS | 4.x |
| ルーティング | react-router-dom | 7.x |
| 状態管理 | zustand | 5.x |
| アイコン | lucide-react | 1.x |
| マスターDB | Google スプレッドシート | - |
| API | Google Apps Script Web App | - |
| ホスティング | GitHub Pages | - |
| CI/CD | GitHub Actions | - |

**未使用（削除不要だが参照しない）**: @supabase/supabase-js, supabase/

---

## 13. プロジェクト構成

```
trepro-quest/
├── .github/workflows/deploy.yml     # GitHub Pages デプロイ
├── public/
│   ├── config.json                  # ランタイム設定（syncApiUrl 等）
│   ├── favicon.svg
│   └── TREPRO_QUEST_MVP1_REQUIREMENTS.md  # 本ドキュメント（ダウンロード用）
├── docs/
│   ├── TREPRO_QUEST_MVP1_REQUIREMENTS.md    # 本ドキュメント（ソース）
│   └── google-sheets/
│       ├── SHEET_SETUP.md
│       └── apps-script/Code.gs      # Apps Script 全文
├── scripts/test-auth.mjs            # 認証テスト
├── src/
│   ├── App.tsx                      # ルーティング
│   ├── main.tsx
│   ├── types/index.ts               # 型定義
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── MemberQuestPage.tsx
│   │   └── AdminPage.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── dataStore.ts
│   ├── lib/
│   │   ├── api.ts                   # データファサード
│   │   ├── sheetsApi.ts             # HTTP クライアント
│   │   ├── localDb.ts               # localStorage
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   ├── missions.ts
│   │   ├── level.ts
│   │   └── stats.ts
│   ├── components/                    # UI コンポーネント群
│   └── styles/pixel.css
├── index.html
├── vite.config.ts                   # base: '/trepro-quest/'
└── package.json
```

---

## 14. 実装手順（ゼロから公開まで）

### Phase 1: フロントエンド骨格（Day 1）

```bash
npm create vite@latest trepro-quest -- --template react-ts
cd trepro-quest
npm install react-router-dom zustand lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

1. `vite.config.ts` に `base: '/trepro-quest/'` を設定
2. `src/types/index.ts` に型定義を作成
3. `src/lib/level.ts`, `missions.ts`, `permissions.ts`, `auth.ts` を実装
4. `src/styles/pixel.css` で 8bit UI スタイルを定義
5. ルーティング（App.tsx）+ ProtectedRoute を実装
6. LoginPage → authStore → リダイレクト

### Phase 2: データ層（Day 1-2）

1. `localDb.ts` — localStorage シードデータ（2メンバー×6ミッション）
2. `config.ts` — config.json ローダー
3. `sheetsApi.ts` — Apps Script HTTP クライアント
4. `api.ts` — ファサード（sheets 優先、local フォールバック）
5. `dataStore.ts` — zustand（load, saveProgress, syncMode, polling）

### Phase 3: 画面実装（Day 2-3）

1. `MemberQuestPage` — タブ + QuestCard + EditQuestModal + レベルアップ演出
2. `AdminPage` — KPI + マトリクス + タブ
3. `AppLayout` — ナビ + SyncStatusBadge + バナー
4. 共通コンポーネント（PixelWindow, ProgressBar, StatusBadge 等）

### Phase 4: Google 連携（Day 3）

1. スプレッドシート作成
2. `Code.gs` を Apps Script に貼り付け
3. `setupMasterData` 実行
4. Web App デプロイ（**実行: 自分 / アクセス: 全員**）
5. `config.json` に syncApiUrl 設定

### Phase 5: デプロイ（Day 3）

1. `.github/workflows/deploy.yml` 作成
2. GitHub リポジトリに push
3. Settings → Pages → GitHub Actions を有効化
4. 動作確認

---

## 15. Google スプレッドシート セットアップ

1. Google スプレッドシートを新規作成
2. スプレッドシート ID をメモ（URL の `/d/{ID}/edit` 部分）
3. Apps Script を設置（次章）
4. `setupMasterData` 実行で以下のシートが自動作成される:
   - ユーザー / メンバー / ミッション / 進捗 / 称号 / ダッシュボード

---

## 16. Apps Script セットアップ

### 16.1 コード設置

1. スプレッドシート → 拡張機能 → Apps Script
2. `docs/google-sheets/apps-script/Code.gs` の **全文** を貼り付け
3. `SPREADSHEET_ID` を自分のスプレッドシート ID に変更
4. 保存

### 16.2 初回データ投入

1. 関数選択: `setupMasterData`
2. 実行（権限承認が必要）
3. シート6つにデータが入ることを確認

### 16.3 Web App デプロイ（重要）

1. デプロイ → 新しいデプロイ（または デプロイを管理 → 編集）
2. 種類: **ウェブアプリ**
3. 設定:

| 項目 | 値 |
|------|-----|
| 説明 | トレプロクエストAPI |
| 次のユーザーとして実行 | **自分** |
| アクセスできるユーザー | **全員** |

> **注意（Google Workspace 利用時）**
> - 「全員」が選択肢にない場合は、管理者に匿名公開の許可を依頼する
> - 「ウェブアプリケーションにアクセスしているユーザー」では **全員が出ない** ため使わない
> - 個人 Gmail でスプレッドシートを作成すれば「全員」が選べる場合がある

4. デプロイ → URL をコピー
5. シークレットウィンドウで URL を開き、`{"ok":true,...}` が返ることを確認

### 16.4 トリガー設置

`setupMasterData` 実行時に `installTriggers()` も自動実行される。
手動の場合は `installTriggers` 関数を実行。

---

## 17. GitHub Pages デプロイ

### 17.1 config.json

```json
{
  "spreadsheetId": "YOUR_SPREADSHEET_ID",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit",
  "syncApiUrl": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  "pollIntervalMs": 15000,
  "sheetNames": {
    "users": "ユーザー",
    "members": "メンバー",
    "missions": "ミッション",
    "progress": "進捗",
    "titles": "称号",
    "dashboard": "ダッシュボード"
  }
}
```

### 17.2 GitHub Actions（deploy.yml）

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      - uses: actions/deploy-pages@v4
```

### 17.3 ビルドコマンド

```bash
npm run build
# 内部: tsc -b && vite build && cp dist/index.html dist/404.html
```

`404.html` のコピーは SPA のリロード対策（GitHub Pages）。

### 17.4 公開確認チェックリスト

- [ ] `https://{user}.github.io/trepro-quest/` にアクセスできる
- [ ] ログイン画面が表示される
- [ ] admin / member でログイン・リダイレクトが正しい
- [ ] 同期バッジが「シート連携」（緑）
- [ ] 進捗編集 → スプレッドシートに反映
- [ ] スプレッドシート直接編集 → UI に反映（15秒以内）

---

## 18. テスト計画

### 18.1 自動テスト

```bash
npm run test:auth
```

| テストケース | 期待結果 |
|-------------|----------|
| support-team@tre-pro.co.jp / trepro2026 | admin ログイン成功 |
| admin@trepro.jp / trepro2026 | admin ログイン成功（エイリアス） |
| asai@tre-pro.co.jp / asai2026 | member ログイン成功 |
| nakaguki@tre-pro.co.jp / nakakuki2026 | member ログイン成功 |
| 大文字小文字混在メール | ログイン成功 |
| 誤パスワード | エラー |
| 未登録メール | エラー |

### 18.2 手動テスト

| # | シナリオ | 確認点 |
|---|----------|--------|
| T1 | admin ログイン | /admin 表示、全員マトリクス表示 |
| T2 | member ログイン | 自分の画面のみ、他人 URL はリダイレクト |
| T3 | ステータス変更保存 | シート反映、バッジ緑維持 |
| T4 | 合格に変更（admin） | レベルアップ演出、称号更新 |
| T5 | シート直接編集 | UI に15秒以内反映 |
| T6 | API 切断時 | ローカルフォールバック、ログイン可能 |
| T7 | タブ切替 | 商談ロープレ/資料作成の表示切替 |

---

## 19. 既知の制約・将来課題

| # | 制約 | 影響 | 将来対応案 |
|---|------|------|-----------|
| C1 | メンバー slug がコードにハードコード（asai, nakakuki） | シートだけではメンバー追加不可 | 動的メンバー対応 |
| C2 | パスワード平文保存 | セキュリティリスク | ハッシュ化 or OAuth |
| C3 | ミッション ID がローカル(UUID)とシート(m-001)で異なる | モード切替時の整合性 | ID 統一 |
| C4 | Google Workspace で匿名公開が制限される場合がある | シート連携不可 | 管理者設定変更 or 個人Gmail |
| C5 | ActivityLog はローカルモードのみ | シート連携時の変更履歴なし | シートにログタブ追加 |
| C6 | Supabase 関連ファイルが残存 | 混乱の可能性 | 削除 or 第2で活用 |

---

## 20. 付録

### 20.1 config.json 全フィールド

| キー | 型 | 説明 |
|------|-----|------|
| spreadsheetId | string | スプレッドシート ID |
| spreadsheetUrl | string | スプレッドシート URL |
| syncApiUrl | string | Apps Script Web App URL |
| pollIntervalMs | number | ポーリング間隔（ms） |
| sheetNames | object | シート名マッピング |

### 20.2 環境変数（オプション）

| 変数 | 用途 |
|------|------|
| VITE_SYNC_API_URL | ビルド時の syncApiUrl フォールバック |
| VITE_SUPABASE_URL | 未使用 |
| VITE_SUPABASE_ANON_KEY | 未使用 |

### 20.3 公開 URL 例

- アプリ: https://tatsuyakoike-cloud.github.io/trepro-quest/
- スプレッドシート: https://docs.google.com/spreadsheets/d/12qHhMQB7DsYZauA64slzs3ABaMcJYMPWivMYgWzqESM/edit
- Apps Script: https://script.google.com/macros/s/AKfycbzzopQFmKZcIs-0xQ_oPfZV2iLLvTDoPsTePpMK78mnt2FqPpZ1M8qf2WyI34EUwPoTuQ/exec

### 20.4 再実装時の最短チェックリスト

```
□ vite + react + ts プロジェクト作成（base: /trepro-quest/）
□ 型定義・auth・permissions・missions・level 実装
□ localDb（localStorage シード）
□ sheetsApi + api ファサード
□ authStore + dataStore（zustand）
□ LoginPage / MemberQuestPage / AdminPage / AppLayout
□ 8bit UI（pixel.css）
□ Google スプレッドシート + Code.gs + setupMasterData
□ Apps Script デプロイ（実行:自分 / アクセス:全員）
□ config.json に syncApiUrl 設定
□ GitHub Actions で Pages デプロイ
□ 404.html コピー（SPA対策）
□ ログイン・同期・編集の手動テスト
```

---

*本ドキュメントはトレプロクエスト第1 MVP の要件を網羅的に定義したものです。このマークダウンと `docs/google-sheets/apps-script/Code.gs` があれば、第三者の AI 開発者は別環境から再実装し GitHub Pages まで公開できます。*
