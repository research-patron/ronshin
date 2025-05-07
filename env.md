# 論文ベース新聞一面生成システム 必須環境変数

このファイルには、あなた（サービス発注者）から私（開発者）に提供していただく必要がある必須環境変数のみを記載しています。これらの情報がないと開発が進められません。

## Firebase設定
※ フロントエンドに直接設定可能。機密度が低いため。
```
# Firebase プロジェクト情報（フロントエンド連携用）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC71N8Azzi20Inh6vJ9xTbBKFybakcM6sc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ronshin-72b20.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ronshin-72b20
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ronshin-72b20.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=708493697034
NEXT_PUBLIC_FIREBASE_APP_ID=1:708493697034:web:bdf22daa3389e4dfca7ff3
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-4LRTY0NXVZ

```

## Google Cloud & Vertex AI設定
Firebase, Vertex AI関連のローケーションは、us-central1を指定してください。

```
# サービスアカウントキー
GOOGLE_APPLICATION_CREDENTIALSの名前でSecret Managerに登録済み。

# Vertex AI設定（論文解析AI用）
VERTEX_AI_PROJECT_IDの名前でSecret Managerに登録済み。
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL_ID=gemini-2.0-flash-001  # 要件定義に従ってgemini-2-0-flashを指定
```

## Stripe決済設定

```
# Stripe API Keys（決済処理用）
STRIPE_PUBLISHABLE_KEYの名前でSecret Managerに登録済み。
STRIPE_SECRET_KEYの名前でSecret Managerに登録済み。
STRIPE_WEBHOOK_SECRETの名前でSecret Managerに登録済み。
STRIPE_WEBHOOKの名前でSecret Managerに登録済み。
```

## Secret Manager参照方法

実運用時は、上記の秘密情報をSecret Managerで安全に管理します。Secret Managerからは常に最新バージョンの秘密情報を参照するように実装します：

```typescript
// Secret Managerから常に最新バージョンの秘密情報を取得する方法（Next.js API Routes用）
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export async function getLatestSecret(secretName: string): Promise<string> {
  const client = new SecretManagerServiceClient();
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${secretName}/versions/latest`;
  const [version] = await client.accessSecretVersion({ name });
  return version.payload.data.toString('utf8');
}
```

## 注意事項

- これらの情報は開発に必須の情報です。開発開始前に必ずご提供ください。
- 本番環境では、これらの秘密情報はSecret Managerを使用して安全に管理します。
- 実運用時にはSecret Managerから常に最新バージョンの秘密情報を参照するよう実装します。
