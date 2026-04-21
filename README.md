# Salon Portfolio

A minimalistic, elegantly designed black-and-white portfolio website for a hair stylist.

## Features
- **Scroll Animations**: Smooth fade-in effects as elements enter the viewport.
- **Dynamic Header Color**: Header adapts to the dark/light background of the current section.
- **Modern Layout**: Centered, balanced design focusing on "Less is More".
- **Responsive**: Fully responsive design for desktop and mobile.

## Tech Stack
- HTML5
- CSS3 (Vanilla)
- Vanilla Javascript
- FontAwesome Icons
- Google Fonts (Outfit & Noto Sans JP)

## Slack Bot (claude-bot) セットアップ

### 1. Slack App の作成
1. [api.slack.com/apps](https://api.slack.com/apps) → 「Create New App」→「From scratch」
2. アプリ名: `claude-bot`、対象ワークスペースを選択

### 2. Bot Token Scopes の設定
左メニュー「OAuth & Permissions」→「Bot Token Scopes」で以下を追加:
- `chat:write`
- `channels:read`
- `im:write`

### 3. Socket Mode の有効化
左メニュー「Socket Mode」→ 有効化 → App-Level Token (`xapp-...`) を発行・保管

### 4. ワークスペースへのインストール
「Install to Workspace」→ `xoxb-` で始まる Bot Token をコピーして安全な場所に保管

### 5. ローカル起動
```bash
cd slack-bot
cp ../.env.example ../.env   # .env を編集してトークンを入力
npm install
npm start
```

> **注意**: `.env` ファイルと Bot Token は絶対に Git にコミットしないこと。
