# Research News - 論文ベース新聞生成システム

学術論文をAIで解析し、誰でも理解できる新聞形式に自動変換するWebアプリケーションです。

## 機能

- 📄 **論文アップロード**: PDFファイルをアップロードして管理
- 🤖 **AI論文解析**: Vertex AI Gemini 2.0 Flashによる自動解析
- 📰 **新聞自動生成**: 5つの論文から新聞一面を自動生成
- 🎨 **テンプレート選択**: 複数のデザインテンプレートから選択可能
- 👥 **グループ共有**: 研究室やチームで新聞を共有
- 📱 **レスポンシブ対応**: PC、タブレット、スマートフォンに対応
- 🎌 **縦書き対応**: 日本の新聞レイアウトを忠実に再現

## 技術スタック

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **AI**: Google Vertex AI Gemini 2.0 Flash
- **Payment**: Stripe
- **PDF**: React-PDF

## セットアップ

### 1. 環境変数の設定

`.env.local.example`を`.env.local`にコピーして、必要な環境変数を設定してください。

```bash
cp .env.local.example .env.local
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Firebase プロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/)で新しいプロジェクトを作成
2. Authentication、Firestore、Storageを有効化
3. Firebaseの設定情報を`.env.local`に追加

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)でアプリケーションにアクセスできます。

## デプロイ

### Firebase Hostingへのデプロイ

```bash
# ビルド
npm run build

# Firebaseにデプロイ
npm run deploy
```

## 料金プラン

- **無料プラン**: 月3回まで新聞生成、最大10件の新聞保存
- **プレミアムプラン**: 月額800円で無制限利用、全機能アクセス

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。