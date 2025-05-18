# 論文ベース新聞一面生成システム

学術論文をもとに新聞一面を自動生成し、専門知識を視覚的にわかりやすく提供するWebアプリケーションです。

## 概要

このシステムは、アップロードされた学術論文をAIで解析し、新聞形式に変換することで、複雑な学術情報を視覚的に理解しやすくします。研究者間の情報共有や一般の方への研究成果の可視化を目的としています。

## 主な機能

- 論文アップロード機能（PDF形式、最大5つ）
- 新聞一面自動生成機能（AIによる解析とレイアウト生成）
- Web閲覧機能
- PDF変換・ダウンロード機能
- 印刷機能（A3サイズ対応）
- 会員管理機能（無料会員・有料会員）
- シェア機能
- 複数テンプレート対応

## 技術スタック

### フロントエンド
- Next.js 14 / TypeScript
- Material UI
- React Context API
- React Hook Form
- PDFKit / html-to-canvas

### バックエンド
- Firebase (Authentication, Firestore, Storage, Functions)
- Vertex AI Gemini 2.0 Flash

## ローカル開発環境のセットアップ

### 前提条件
- Node.js 18以上
- npm 7以上
- Firebase CLI

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd research-news-app
```

2. 依存パッケージをインストール
```bash
npm install
```

3. 環境変数の設定
`.env.local.example`をコピーして`.env.local`を作成し、必要な環境変数を設定します。

4. 開発サーバーの起動
```bash
npm run dev
```

## デプロイ

### Firebaseへのデプロイ

```bash
# Firebaseにログイン
firebase login

# Firebaseプロジェクトを設定
firebase use <project-id>

# 静的ファイルのビルド
npm run build

# デプロイ実行
firebase deploy
```

## 会員プラン

| 機能 | 無料会員 | 有料会員 |
|------|---------|----------|
| 新聞生成 | 月3回まで | 無制限 |
| 保存件数 | 最大10件 | 無制限 |
| テンプレート | 3種類 | 10種類 |
| カスタムロゴ | × | ○ |
| 広告表示 | あり | なし |
| PDF出力 | ○ | ○ |

## ライセンス

このプロジェクトは非公開ソフトウェアです。