# セットアップガイド

## 前提条件

- Node.js 18以上
- npm または yarn
- Firebaseアカウント
- Google Cloudアカウント（Vertex AI用）
- Stripeアカウント（決済処理用）

## 詳細セットアップ手順

### 1. Firebaseプロジェクトの設定

#### 1.1 プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例：research-news-app）
4. Google Analyticsを有効化（オプション）

#### 1.2 Authenticationの設定

1. 左メニューから「Authentication」を選択
2. 「始める」をクリック
3. Sign-in methodタブで以下を有効化：
   - メール/パスワード
   - Google

#### 1.3 Firestoreの設定

1. 左メニューから「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. 本番モードで開始
4. ロケーションを選択（asia-northeast1推奨）
5. セキュリティルールをコピー（firestore.rules）
6. インデックスをコピー（firestore.indexes.json）

#### 1.4 Cloud Storageの設定

1. 左メニューから「Storage」を選択
2. 「始める」をクリック
3. セキュリティルールをコピー（storage.rules）

### 2. Google Cloud設定（Vertex AI）

#### 2.1 APIの有効化

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. Vertex AI APIを有効化
3. サービスアカウントを作成
4. 認証キーをダウンロード

#### 2.2 環境変数の設定

```bash
# .env.local
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
VERTEX_AI_LOCATION=asia-northeast1
```

### 3. Stripe設定

1. [Stripe Dashboard](https://dashboard.stripe.com/)にアクセス
2. APIキーを取得
3. 商品と価格を作成：
   - 月額プラン: ¥800/月
   - 年額プラン: ¥8,000/年

### 4. Firebase Functions設定

```bash
# Firebase CLIのインストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクトの初期化
firebase init functions

# Python環境のセットアップ
cd functions
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. 初期データの投入

Firestoreに以下のコレクションを作成：

#### templates コレクション

```javascript
// 標準テンプレート
{
  id: "standard-1",
  name: "スタンダード",
  description: "基本的な新聞レイアウト",
  previewImageUrl: "/templates/standard-1.png",
  isPremium: false,
  category: "standard",
  layout: { /* レイアウト定義 */ },
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### 6. ローカル開発環境の起動

```bash
# フロントエンド
npm run dev

# Firebase エミュレータ（別ターミナル）
firebase emulators:start
```

## トラブルシューティング

### CORS エラーが発生する場合

Cloud Storageのバケットに以下のCORS設定を追加：

```json
[
  {
    "origin": ["http://localhost:3000", "https://your-domain.com"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type"]
  }
]
```

### Vertex AI の認証エラー

1. サービスアカウントキーのパスを確認
2. Google Cloud SDKで認証：
   ```bash
   gcloud auth application-default login
   ```

### Firebase Functionsのデプロイエラー

Python環境が正しく設定されているか確認：
```bash
cd functions
python --version  # 3.11以上
pip list  # 依存関係の確認
```