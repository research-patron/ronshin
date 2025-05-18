import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '論文ベース新聞一面生成システム',
  description: '学術論文をもとに新聞一面を自動生成し、専門知識を視覚的にわかりやすく提供するサービス',
  keywords: '論文, 新聞, AI, 研究, 学術, 可視化',
  authors: [
    {
      name: 'Research News Team',
    },
  ],
  openGraph: {
    title: '論文ベース新聞一面生成システム',
    description: '学術論文をもとに新聞一面を自動生成し、専門知識を視覚的にわかりやすく提供するサービス',
    url: 'https://research-news-app.web.app',
    siteName: '論文ベース新聞一面生成システム',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '論文ベース新聞一面生成システム',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}