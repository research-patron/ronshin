import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ホームに戻る
            </Button>
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg px-6 py-8 sm:px-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Research News（以下、「当サービス」）は、お客様のプライバシーを尊重し、個人情報の保護に努めております。
              本プライバシーポリシーは、当サービスがどのように個人情報を収集、使用、開示、保護するかについて説明します。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. 収集する情報</h2>
            <p className="text-gray-600 mb-4">当サービスは、以下の情報を収集する場合があります：</p>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>アカウント情報（氏名、メールアドレス、所属機関）</li>
              <li>アップロードされた論文ファイル</li>
              <li>生成された新聞データ</li>
              <li>サービス利用履歴</li>
              <li>お支払い情報（プレミアムプランご利用の場合）</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. 情報の使用目的</h2>
            <p className="text-gray-600 mb-4">収集した情報は、以下の目的で使用されます：</p>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>サービスの提供および改善</li>
              <li>アカウントの管理とセキュリティの確保</li>
              <li>カスタマーサポートの提供</li>
              <li>サービスに関する重要な通知の送信</li>
              <li>法的要件への対応</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. 情報の共有</h2>
            <p className="text-gray-600 mb-6">
              当サービスは、お客様の同意なしに個人情報を第三者に販売、貸与、または共有することはありません。
              ただし、以下の場合を除きます：
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>法的要求に応じる必要がある場合</li>
              <li>サービス提供に必要な業務委託先との共有（機密保持契約締結済み）</li>
              <li>お客様の明示的な同意がある場合</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. データセキュリティ</h2>
            <p className="text-gray-600 mb-6">
              当サービスは、お客様の個人情報を保護するため、業界標準のセキュリティ対策を実施しています。
              これには、暗号化、アクセス制御、定期的なセキュリティ監査が含まれます。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. データの保持と削除</h2>
            <p className="text-gray-600 mb-6">
              お客様の個人情報は、サービス提供に必要な期間のみ保持されます。
              アカウントを削除される場合、関連する個人情報も適切に削除されます。
              ただし、法的要求により一定期間保持が必要な情報は除きます。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Cookieの使用</h2>
            <p className="text-gray-600 mb-6">
              当サービスは、ユーザー体験の向上とサービスの分析のためにCookieを使用します。
              ブラウザの設定によりCookieを無効にすることも可能ですが、一部の機能が制限される場合があります。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. お子様のプライバシー</h2>
            <p className="text-gray-600 mb-6">
              当サービスは、13歳未満のお子様を対象としていません。
              13歳未満の方は、保護者の同意なしに個人情報を提供しないでください。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. プライバシーポリシーの変更</h2>
            <p className="text-gray-600 mb-6">
              当サービスは、必要に応じて本プライバシーポリシーを更新する場合があります。
              重要な変更がある場合は、メールまたはサービス内で通知いたします。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. お問い合わせ</h2>
            <p className="text-gray-600 mb-6">
              プライバシーに関するご質問やご懸念がございましたら、以下までお問い合わせください：
            </p>
            <p className="text-gray-600 mb-2">Email: privacy@research-news.com</p>
            <p className="text-gray-600 mb-6">住所: 〒100-0001 東京都千代田区千代田1-1</p>

            <p className="text-gray-500 text-sm mt-8">
              最終更新日: 2024年1月1日
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}