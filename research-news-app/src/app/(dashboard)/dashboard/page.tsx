'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paper, Newspaper } from '@/types';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Newspaper as NewspaperIcon, 
  Plus, 
  Clock, 
  TrendingUp,
  Upload,
  Crown
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function DashboardPage() {
  const { userData, currentUser } = useAuth();
  const [recentPapers, setRecentPapers] = useState<Paper[]>([]);
  const [recentNewspapers, setRecentNewspapers] = useState<Newspaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchRecentData();
    }
  }, [currentUser]);

  const fetchRecentData = async () => {
    try {
      // Fetch recent papers
      const papersQuery = query(
        collection(db, 'papers'),
        where('uploaderId', '==', currentUser!.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const papersSnapshot = await getDocs(papersQuery);
      const papers = papersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Paper));
      setRecentPapers(papers);

      // Fetch recent newspapers
      const newspapersQuery = query(
        collection(db, 'newspapers'),
        where('creatorId', '==', currentUser!.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const newspapersSnapshot = await getDocs(newspapersQuery);
      const newspapers = newspapersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Newspaper));
      setRecentNewspapers(newspapers);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      name: 'アップロード論文数',
      value: recentPapers.length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: '作成した新聞数',
      value: recentNewspapers.length,
      icon: NewspaperIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: '今月の生成回数',
      value: userData?.generatedCount || 0,
      limit: userData?.membershipTier === 'free' ? 3 : '無制限',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: '会員ステータス',
      value: userData?.membershipTier === 'premium' ? 'プレミアム' : '無料',
      icon: Crown,
      color: userData?.membershipTier === 'premium' ? 'text-yellow-600' : 'text-gray-600',
      bgColor: userData?.membershipTier === 'premium' ? 'bg-yellow-100' : 'bg-gray-100',
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          ようこそ、{userData?.displayName}さん
        </h1>
        <p className="text-gray-600 mt-1">
          論文から新聞を生成して、研究成果を分かりやすく共有しましょう
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className={cn('absolute rounded-md p-3', item.bgColor)}>
                <item.icon className={cn('h-6 w-6', item.color)} aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {item.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {item.value}
                {item.limit && (
                  <span className="text-sm text-gray-500 font-normal">
                    {' '}/ {item.limit}
                  </span>
                )}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/papers/upload">
            <Button className="w-full justify-start" size="lg">
              <Upload className="mr-2 h-5 w-5" />
              論文をアップロード
            </Button>
          </Link>
          <Link href="/dashboard/newspapers/create">
            <Button className="w-full justify-start" size="lg" variant="outline">
              <Plus className="mr-2 h-5 w-5" />
              新聞を作成
            </Button>
          </Link>
          {userData?.membershipTier === 'free' && (
            <Link href="/dashboard/upgrade">
              <Button className="w-full justify-start" size="lg" variant="secondary">
                <Crown className="mr-2 h-5 w-5" />
                プレミアムにアップグレード
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Papers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近の論文</h2>
            <Link href="/dashboard/papers">
              <Button variant="ghost" size="sm">
                すべて見る
              </Button>
            </Link>
          </div>
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="p-6 text-center text-gray-500">読み込み中...</div>
            ) : recentPapers.length === 0 ? (
              <div className="p-6 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  まだ論文がアップロードされていません
                </p>
                <Link href="/dashboard/papers/upload">
                  <Button className="mt-4" size="sm">
                    最初の論文をアップロード
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentPapers.map((paper) => (
                  <li key={paper.id} className="px-6 py-4 hover:bg-gray-50">
                    <Link href={`/dashboard/papers/${paper.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {paper.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {paper.authors.join(', ')}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {format(paper.createdAt.toDate(), 'MM/dd', { locale: ja })}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Newspapers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近の新聞</h2>
            <Link href="/dashboard/newspapers">
              <Button variant="ghost" size="sm">
                すべて見る
              </Button>
            </Link>
          </div>
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="p-6 text-center text-gray-500">読み込み中...</div>
            ) : recentNewspapers.length === 0 ? (
              <div className="p-6 text-center">
                <NewspaperIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  まだ新聞が作成されていません
                </p>
                <Link href="/dashboard/newspapers/create">
                  <Button className="mt-4" size="sm">
                    最初の新聞を作成
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentNewspapers.map((newspaper) => (
                  <li key={newspaper.id} className="px-6 py-4 hover:bg-gray-50">
                    <Link href={`/dashboard/newspapers/${newspaper.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {newspaper.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {newspaper.content?.header?.newspaperName || '新聞'}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {format(newspaper.createdAt.toDate(), 'MM/dd', { locale: ja })}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
  }
}