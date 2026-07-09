# GitHub Stats Widget — Design Spec

- **Date**: 2026-07-06
- **Repo**: `sna4i/profile`
- **Status**: Approved (design)

## Overview

Linksセクションの GitHub リンク付近に、`sna4i` の GitHub 公開統計を表示する自作ウィジェットを追加する。
外部SVGサービス（github-readme-stats等）に依存せず、Astro のビルド時に GitHub REST API から取得したデータを、
サイトの配色（indigo→purple）に合わせて自前で描画する。外部サービス非依存・完全自己完結・デザイン統一を満たす。

## Real Data Snapshot (grounding, 2026-07-06)

設計を現実に即させるため、実際の公開値を確認済み。

| メトリクス | 実値 | 採否 |
|---|---|---|
| `public_repos` | 11 | ✅ 採用 |
| account `created_at` | 2016-10-05（約10年） | ✅ 採用 |
| languages (by primary lang) | Python 4 / HTML 2 / JavaScript 1 / Astro 1 | ✅ 採用 |
| `followers` | 3 | ❌ 非採用（控えめ） |
| total stars / forks | 0 / 0 | ❌ 非採用（見せると逆効果） |

star/fork が 0 のため、rank を star 重み付けで大きく表示する github-readme-stats は不利。
自作カードで「正直かつ映える」3項目のみを表示する判断の根拠になっている。

## Requirements

| ID | 要件 |
|---|---|
| F-001 | ビルド時に GitHub REST API（無認証）から `sna4i` の統計を取得する |
| F-002 | Public Repos 数を大きな数字タイルで表示する |
| F-003 | GitHub歴（`created_at` からの年数）を数字タイル＋"since 2016" 補足で表示する |
| F-004 | 使用言語をリポジトリ主要言語カウントで集計し、積み上げ横バー＋凡例で表示する |
| F-005 | Stars / Forks / Followers は表示しない |
| F-006 | ja / en 両ロケールでラベルを出し分ける |
| F-007 | ウィジェットは #links セクション内・GitHubボタンの直下に配置する |
| N-001 | API 取得失敗（レート制限403・障害）時も**ビルドを壊さず**、同梱スナップショットで描画する（可用性） |
| N-002 | 配信 HTML は静的で、閲覧時に外部リクエストを発生させない（プライバシー・自己完結） |
| N-003 | 既存の design system（配色・角丸・`animate-on-scroll`・`jp-wrap`）と視覚的に統一する（一貫性） |

## Architecture / Data Flow

```
index.astro (ja) ─┐
                  ├─ getGithubStats('sna4i')      ← ビルド時 fetch（1〜2回）
en/index.astro ───┘        │  try: api.github.com  →  catch: src/data/github-stats.json
                           ▼
        <GithubStats stats={GithubStats} labels={profile.ui.github} locale={Locale} />
```

- データ取得はページ（`index.astro` / `en/index.astro`）の frontmatter で行い、`stats` を prop で子に渡す。
  既存の「`profile` を prop で流す」方式に合わせ、`GithubStats.astro` は内部で fetch しない純粋な表示コンポーネントにする。

## Components (single responsibility)

| ファイル | 役割 | 公開インターフェース | 依存 |
|---|---|---|---|
| `src/lib/github.ts` | データ層。取得・整形・フォールバック | `getGithubStats(username: string): Promise<GithubStats>` | `fetch`, fallback json |
| `src/data/github-stats.json` | フォールバック用スナップショット（安全網） | — | なし |
| `src/components/GithubStats.astro` | 表示層。カード描画 | Props: `{ stats: GithubStats; labels: GithubLabels; locale: Locale }` | 型のみ |
| `src/types.ts`（追記） | 型定義 | `GithubStats`, `GithubLabels`, `Profile.ui.github` | — |
| `profile.{ja,en}.json`（追記） | i18n ラベル | `ui.github` | — |

### Data contract

```ts
// src/types.ts (追記)
export interface LanguageStat {
  name: string;    // "Python"
  count: number;   // 主要言語としてのリポジトリ数
  percent: number; // 0-100（整数丸め）。基準は「主要言語が検出されたリポジトリの総数」＝Σcount。バーが100%まで埋まる
  color: string;   // Linguist 慣例色 (#3572A5 等)
}

export interface GithubStats {
  username: string;      // "sna4i"
  profileUrl: string;    // "https://github.com/sna4i"
  publicRepos: number;   // 11
  memberSinceYear: number; // 2016
  yearsOnGithub: number;   // build 時点で算出（現在年 - 2016）
  languages: LanguageStat[]; // percent 降順、上位のみ
  source: 'live' | 'fallback'; // 取得元（デバッグ/検証用）
}

export interface GithubLabels {
  heading: string;      // "GitHub Activity"
  repos: string;        // ja:"リポジトリ" / en:"Repositories"
  years: string;        // ja:"GitHub歴（年）" / en:"Years on GitHub"
  sincePrefix: string;  // ja:"登録 " / en:"since "  → `${sincePrefix}2016`
  languages: string;    // ja:"使用言語" / en:"Top Languages"
}
```

### `getGithubStats` behavior

1. `GET https://api.github.com/users/{username}` → `public_repos`, `created_at`
2. `GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated` → 主要言語を集計
3. `languages`: `repo.language`（null は除外）を数え、`percent = round(count / Σcount * 100)` を算出、`percent` 降順にソート。上位5件に制限。丸め誤差で合計が100%からずれてもバー描画上は許容。
4. `yearsOnGithub = currentYear - memberSinceYear`（Astro ビルドの `new Date()` を使用。Footer と同様に許容）
5. Linguist 色マップ（`src/lib/github.ts` 内の小さな定数）で `color` を付与。未知言語は既定のグレー `#9CA3AF`。
6. **いずれかの fetch が失敗・非200・例外**なら `src/data/github-stats.json` を読み、`source:'fallback'` で返す。
   ネットワーク例外でビルドが停止しないよう全体を try/catch で保護する。

### Fallback snapshot (`src/data/github-stats.json`)

初期シード（2026-07-06 実値）:

```json
{
  "username": "sna4i",
  "publicRepos": 11,
  "memberSinceYear": 2016,
  "languages": [
    { "name": "Python", "count": 4 },
    { "name": "HTML", "count": 2 },
    { "name": "JavaScript", "count": 1 },
    { "name": "Astro", "count": 1 }
  ]
}
```

`percent` / `color` / `yearsOnGithub` は `getGithubStats` 側で算出するため、スナップショットは生カウントのみ保持する。

## Layout / Visual

配置: `#links` セクション内、GitHubボタンの直下。白カード `rounded-2xl shadow-sm`・`animate-on-scroll`。

```
┌─────────────────────────────────────────────┐
│  GitHub Activity                             │
│                                              │
│     ┌─────────┐      ┌─────────┐             │
│     │   11    │      │   10    │             │
│     │  Repos  │      │  Years  │  since 2016 │
│     └─────────┘      └─────────┘             │
│                                              │
│  Top Languages                               │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░▒▒▒▒▓▓                   │
│  ● Python 50%  ● HTML 25%  ● JS 12%  ● Astro │
└─────────────────────────────────────────────┘
```

- 数字タイル: 大きな数字（gradient text 可）＋ラベル。Years タイルに "since 2016" を小さく添える。
- 言語バー: 単一の積み上げ横バー（`percent` で幅）。角丸。セグメント色は Linguist 慣例色。
- 凡例: 色ドット＋言語名＋`percent`% のチップを横並び。
- JP テキスト箇所は `jp-wrap` を付与。

### Language color map (Linguist convention, hardcoded)

| 言語 | 色 |
|---|---|
| Python | `#3572A5` |
| HTML | `#e34c26` |
| JavaScript | `#f1e05a` |
| TypeScript | `#3178c6` |
| Astro | `#ff5a03` |
| CSS | `#563d7c` |
| Shell | `#89e051` |
| (fallback) | `#9CA3AF` |

## Design Decisions

| 論点 | 決定 | 理由 |
|---|---|---|
| 言語集計 | リポジトリ主要言語カウント（API 2回） | 確定的・API呼び出し最小。バイト加重(`/languages`×11)は精密だが今回の規模には過剰 |
| データ鮮度 | ビルド時スナップショット | 再デプロイで更新。repos/言語は変化が遅く、週次cronは YAGNI |
| 認証 | 無認証（60req/h） | ビルド頻度に対し十分。3項目に token 不要 |
| 取得場所 | ページ frontmatter | 既存の prop 流し込み方式に一致、表示コンポーネントを純粋に保つ |

## Non-Functional

- **可用性 (N-001)**: fetch 失敗でビルドを止めない。フォールバックで常に描画。
- **プライバシー/自己完結 (N-002)**: 配信 HTML は静的、閲覧時の外部リクエストなし。
- **一貫性 (N-003)**: 既存 design system に統一。新規依存パッケージなし。
- **保守性**: データ層と表示層を分離。ユーザー名・色マップは定数化。

## Testing (観点ベース)

| ID | 観点 | 確認方法 |
|---|---|---|
| T-001 | ライブ取得成功時に実値が描画される | `npm run build` 後、`dist/index.html` に repos=11・言語バーが含まれる |
| T-002 | 取得失敗時にフォールバックで描画されビルドが成功する | fetch をダミー失敗させても build が完走し `source:'fallback'` になる |
| T-003 | ja/en でラベルが出し分く | `dist/index.html`＝日本語ラベル、`dist/en/index.html`＝英語ラベル |
| T-004 | 配色・角丸・アニメーションが既存カードと統一 | プレビューで #links を目視（Playwright スクショ） |
| T-005 | percent 合計が概ね100%・降順 | 生成 HTML のバー幅・凡例を確認 |

## Out of Scope (YAGNI)

- コントリビューション数・草（contribution graph）・streak（GraphQL＋token が必要）
- Stars / Forks / Followers 表示
- 週次 cron 自動リビルド
- 複数ユーザー対応（`sna4i` 固定でよい、ただし関数引数化はする）
