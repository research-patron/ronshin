# 論文ベース新聞一面生成システム セットアップガイド

このガイドでは、論文ベース新聞一面生成システムのセットアップ手順と基本的な利用方法を説明します。

## 開発環境のセットアップ

### 必要条件
- Node.js 18.x以上
- npm 7.x以上
- Firebase CLI
- Google Cloud SDK（Vertex AIへのアクセス用）

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd research-news-app
```

2. 依存パッケージのインストール
```bash
npm install
```

3. 環境変数の設定
`.env.local.example`をコピーして`.env.local`を作成し、必要な環境変数を設定します。

```bash
cp .env.local.example .env.local
```

`.env.local`ファイルを編集し、Firebase、Google Cloud、Stripeなどの認証情報を設定します。

4. Firebaseプロジェクトの設定
Firebaseプロジェクトがまだ作成されていない場合は、Firebase Consoleで新しいプロジェクトを作成し、必要なサービス（Authentication、Firestore、Storage、Functions）を有効にします。

```bash
# Firebase CLIをインストール
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# Firebaseプロジェクトの初期化
firebase init
```

5. Vertex AIの設定
Google Cloud Consoleで以下の手順に従って、Vertex AI APIを有効にします：
- Vertex AI APIを有効化
- サービスアカウントを作成し、適切な権限を付与
- サービスアカウントのキーを作成し、ダウンロード
- ダウンロードしたキーファイルは安全な場所に保存し、`GOOGLE_APPLICATION_CREDENTIALS`環境変数に設定

6. 開発サーバーの起動
```bash
npm run dev
```

## 主要機能の利用方法

### 会員登録とログイン
- メールアドレスとパスワードを使用して登録
- Googleアカウントでのログインもサポート

### 論文アップロード
1. ダッシュボードから「論文管理」を選択
2. 「論文アップロード」ボタンをクリック
3. PDFファイルを選択（最大5つ）
4. 必要なメタデータを入力
5. 「アップロード」ボタンをクリック

### 新聞生成
1. ダッシュボードから「新聞作成」を選択
2. アップロード済みの論文を選択（最大5つ）
3. テンプレートを選択
4. 「生成開始」ボタンをクリック
5. AIによる解析と生成が完了するまで待機
6. 生成された新聞をプレビュー

### 新聞編集
- ヘッドラインの編集
- 記事内容の調整
- レイアウトのカスタマイズ
- フォントやカラースキームの変更（有料会員のみ）
- カスタムロゴの追加（有料会員のみ）

### PDFエクスポートと印刷
- 「PDF出力」ボタンをクリックして設定を選択
- A3サイズでの印刷に最適化
- 生成されたPDFをダウンロード

### 共有機能
- SNSでの共有
- メール送信
- 共有リンクの生成
- グループ内での共有設定

## デプロイ手順

### Firebase Hostingへのデプロイ

1. 本番用ビルドの作成
```bash
npm run build
```

2. Firebaseにデプロイ
```bash
firebase deploy
```

これにより、以下のサービスがデプロイされます：
- Webアプリケーション (Hosting)
- Firestore構成とセキュリティルール
- Cloud Functions
- Storage設定

## トラブルシューティング

### 一般的な問題

1. **依存パッケージのエラー**
```bash
npm clean-install
```

2. **Firebaseとの接続エラー**
- Firebase Consoleで設定が正しいか確認
- 環境変数が正しく設定されているか確認

3. **Vertex AIとの接続エラー**
- Google Cloud Consoleで権限が正しく設定されているか確認
- サービスアカウントキーが正しいパスに配置されているか確認

4. **ビルドエラー**
- Node.jsとnpmのバージョンが最新か確認
- 互換性のない依存関係がないか確認

## メンテナンス

### 定期的なメンテナンス
- 依存パッケージの更新
- セキュリティパッチの適用
- バックアップの実行

### モニタリング
- Firebase Consoleでのエラー監視
- Google Cloud Monitoringでのパフォーマンス監視
- ユーザーフィードバックの収集と対応

## 技術的サポート

技術的な問題やカスタマイズについては、以下のリソースを参照してください：
- GitHub Issues
- 開発者ドキュメント
- FAQセクション

---
© Research News Team, 2024