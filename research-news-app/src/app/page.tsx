'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { 
  Newspaper,
  Users,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    name: 'AI論文解析',
    description: '最新のAI技術で論文を自動解析し、重要な情報を抽出します',
    icon: Zap,
  },
  {
    name: '新聞形式で視覚化',
    description: '複雑な学術内容を一般的な新聞レイアウトで分かりやすく表示',
    icon: Newspaper,
  },
  {
    name: 'グループ共有',
    description: '研究室やチームで簡単に成果を共有できます',
    icon: Users,
  },
  {
    name: 'セキュアな環境',
    description: '大切な研究データを安全に管理・保護します',
    icon: Shield,
  },
];

const plans = [
  {
    name: '無料プラン',
    price: '¥0',
    description: '個人研究者向け',
    features: [
      '月3回まで新聞生成',
      '最大10件の新聞保存',
      '標準テンプレート3種',
      'PDFダウンロード',
    ],
    cta: '無料で始める',
    featured: false,
  },
  {
    name: 'プレミアムプラン',
    price: '¥800',
    period: '/月',
    description: '研究室・チーム向け',
    features: [
      '無制限の新聞生成',
      '無制限の新聞保存',
      '全テンプレート10種以上',
      '論文要約機能',
      'カスタムロゴ追加',
      '広告非表示',
      '優先サポート',
    ],
    cta: 'プレミアムで始める',
    featured: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Research News</h1>
          </div>
          <div className="flex gap-x-6">
            <Link href="/login">
              <Button variant="ghost">ログイン</Button>
            </Link>
            <Link href="/register">
              <Button>無料で始める</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              論文を新聞に変える
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              AIが学術論文を解析し、誰でも理解できる新聞形式に自動変換。
              研究成果を視覚的に分かりやすく共有できます。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button size="lg">
                  無料で始める
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="ghost" size="lg">
                  詳しく見る
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">
              高速・正確・使いやすい
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              研究成果の共有を、もっと簡単に
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              最新のAI技術と直感的なインターフェースで、
              論文の価値を最大限に引き出します
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              シンプルな料金プラン
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              個人研究者から研究室まで、ニーズに合わせて選べます
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 ring-1 ${
                  plan.featured
                    ? 'bg-gray-900 ring-gray-900'
                    : 'ring-gray-200'
                }`}
              >
                <h3
                  className={`text-lg font-semibold leading-8 ${
                    plan.featured ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-4 text-sm leading-6 ${
                    plan.featured ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {plan.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span
                    className={`text-4xl font-bold tracking-tight ${
                      plan.featured ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={`text-sm font-semibold leading-6 ${
                        plan.featured ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </p>
                <ul
                  className={`mt-8 space-y-3 text-sm leading-6 ${
                    plan.featured ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckCircle
                        className={`h-6 w-5 flex-none ${
                          plan.featured ? 'text-white' : 'text-blue-600'
                        }`}
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    className={`mt-8 w-full ${
                      plan.featured
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : ''
                    }`}
                    variant={plan.featured ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              今すぐ始めましょう
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              5つの論文をアップロードするだけで、
              プロフェッショナルな新聞が完成します
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  無料アカウント作成
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center space-x-6 md:order-2">
              <Link href="/terms" className="text-gray-400 hover:text-gray-300">
                利用規約
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-gray-300">
                プライバシーポリシー
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-gray-300">
                お問い合わせ
              </Link>
            </div>
            <div className="mt-8 md:order-1 md:mt-0">
              <p className="text-center text-xs leading-5 text-gray-400">
                &copy; 2024 Research News. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
