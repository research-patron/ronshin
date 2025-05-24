'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Crown,
  CheckCircle,
  ArrowRight,
  CreditCard,
  Shield,
  Zap,
  Users,
  FileText,
  Palette,
  BarChart
} from 'lucide-react';

const features = [
  {
    name: '無制限の新聞生成',
    description: '月間の生成回数制限なし',
    icon: Zap,
    free: '月3回まで',
    premium: '無制限',
  },
  {
    name: '新聞の保存',
    description: '作成した新聞を保存',
    icon: FileText,
    free: '最大10件',
    premium: '無制限',
  },
  {
    name: 'テンプレート',
    description: 'デザインテンプレート',
    icon: Palette,
    free: '基本3種類',
    premium: '全10種類以上',
  },
  {
    name: '論文要約機能',
    description: 'AI による詳細な要約',
    icon: BarChart,
    free: '基本要約のみ',
    premium: '詳細要約 + 分析',
  },
  {
    name: 'カスタムロゴ',
    description: 'オリジナルロゴの追加',
    icon: Shield,
    free: '×',
    premium: '○',
  },
  {
    name: '広告表示',
    description: '新聞内の広告',
    icon: Users,
    free: '表示あり',
    premium: '非表示',
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Stripe checkout session creation would go here
      alert('決済機能は実装中です');
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('アップグレードに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const price = billingCycle === 'monthly' ? 800 : 8000;
  const savings = billingCycle === 'yearly' ? 1600 : 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            プレミアムプランにアップグレード
          </h1>
          <p className="text-lg text-gray-600">
            すべての機能を無制限に使用して、研究成果をより効果的に共有しましょう
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600'
              }`}
            >
              月額プラン
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600'
              }`}
            >
              年額プラン
              {billingCycle === 'yearly' && (
                <span className="ml-2 text-green-600 text-sm font-semibold">
                  2ヶ月分お得！
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="text-center mb-12">
          <div className="flex items-baseline justify-center">
            <span className="text-5xl font-bold text-gray-900">¥{price.toLocaleString()}</span>
            <span className="text-xl text-gray-600 ml-2">
              {billingCycle === 'monthly' ? '/月' : '/年'}
            </span>
          </div>
          {billingCycle === 'yearly' && (
            <p className="text-green-600 mt-2">
              年間 ¥{savings.toLocaleString()} お得！
            </p>
          )}
        </div>

        {/* Features Comparison */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  機能
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  無料プラン
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                  プレミアムプラン
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {features.map((feature) => (
                <tr key={feature.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <feature.icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {feature.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {feature.free}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 bg-blue-50">
                    {feature.premium}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            size="lg"
            className="px-8"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            プレミアムプランを開始
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              安全な決済
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              いつでもキャンセル可能
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <p className="text-gray-600 italic">
            &ldquo;プレミアムプランにアップグレードしてから、研究室内での情報共有が格段に効率化されました。
            無制限に新聞を作成できるので、定期的に研究成果をまとめて配布しています。&rdquo;
          </p>
          <p className="mt-4 text-sm font-semibold text-gray-900">
            — 田中教授、東京大学
          </p>
        </div>
      </div>
    </div>
  );
}