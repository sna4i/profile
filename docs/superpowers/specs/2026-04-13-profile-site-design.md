# Profile Site Design Spec

## Overview

GitHub Pages でホスティングするプロフィール＋ポートフォリオサイト。
リポジトリ: `yuya4i/yuya` / カスタムドメインで公開。

## Site Structure

シングルページ構成。上部固定ナビで各セクションへスムーズスクロール。

| Section  | Content                            |
|----------|------------------------------------|
| Header   | ナビゲーション（セクションリンク）     |
| Hero     | ハンドルネーム + 職業 + 一言         |
| About    | 自己紹介 + 経歴                     |
| Skills   | スキルセット（カード or タグ表示）    |
| Projects | プロジェクト紹介（カードグリッド）    |
| Links    | SNS / GitHub / その他リンク         |
| Footer   | コピーライト等                      |

## Design System

### Colors

- Base: `#FAFAFA` (white), `#F0F0F0` (light gray)
- Text: `#1A1A2E` (dark gray)
- Accent: `#6366F1` → `#8B5CF6` (indigo-purple gradient)
- Sub-accent: `#34D399` (mint green, for skill tags etc.)

### Typography

- Headings: Inter (bold, clean)
- Body: Noto Sans JP (Japanese support)

### Animations

- Scroll-triggered fade-in for sections
- Hover lift-up on skill/project cards
- Slow gradient animation or typing effect on Hero
- Subtle and elegant, not excessive

### Components

- Cards: rounded corners + light shadow, shadow emphasis on hover
- Buttons/Links: accent gradient background or border
- Section spacing: generous (`py-20` equivalent)

## Tech Stack

- **Framework**: Astro (SSG)
- **Styling**: Tailwind CSS
- **Animations**: CSS animations + lightweight library as needed
- **Fonts**: Google Fonts (Inter, Noto Sans JP)
- **Deploy**: GitHub Actions → GitHub Pages
- **Domain**: Custom domain via `public/CNAME`

## Project Structure

```
yuya/
├── src/
│   ├── components/    # Hero, About, Skills, Projects, Links
│   ├── layouts/       # Base layout
│   ├── pages/
│   │   └── index.astro
│   ├── styles/
│   │   └── global.css
│   └── data/
│       └── profile.json
├── public/
│   └── images/
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## Content Management

All profile content managed in `src/data/profile.json`:

```json
{
  "name": "Handle Name",
  "title": "Job Title",
  "tagline": "One-liner",
  "about": "Self introduction text",
  "experience": [...],
  "skills": [...],
  "projects": [...],
  "links": [...]
}
```

Updating content = editing JSON only.

## Deployment

- GitHub Actions workflow triggers on push to `main`
- Runs `astro build`, deploys `dist/` to GitHub Pages
- Custom domain configured via `public/CNAME`
