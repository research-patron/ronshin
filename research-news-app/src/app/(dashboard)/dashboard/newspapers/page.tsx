'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Newspaper } from '@/types';
import { Button } from '@/components/ui/Button';
import { 
  Newspaper as NewspaperIcon,
  Plus,
  Trash2,
  Eye,
  Share2,
  Download,
  Lock,
  Globe,
  Users,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function NewspapersPage() {
  const { currentUser, userData } = useAuth();
  const [newspapers, setNewspapers] = useState<Newspaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchNewspapers();
    }
  }, [currentUser]);

  const fetchNewspapers = async () => {
    try {
      const newspapersQuery = query(
        collection(db, 'newspapers'),
        where('creatorId', '==', currentUser!.uid),
        orderBy('createdAt', 'desc')
      );
      const newspapersSnapshot = await getDocs(newspapersQuery);
      const newspapersData = newspapersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Newspaper));
      setNewspapers(newspapersData);
    } catch (error) {
      console.error('Error fetching newspapers:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNewspaper = async (newspaperId: string) => {
    if (!confirm('この新聞を削除してもよろしいですか？')) return;
    
    try {
      await deleteDoc(doc(db, 'newspapers', newspaperId));
      setNewspapers(prev => prev.filter(n => n.id !== newspaperId));
    } catch (error) {
      console.error('Error deleting newspaper:', error);
      alert('新聞の削除に失敗しました。');
    }
  };

  const getShareIcon = (type: string) => {
    switch (type) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'public':
        return <Globe className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getShareText = (type: string) => {
    switch (type) {
      case 'private':
        return '非公開';
      case 'group':
        return 'グループ共有';
      case 'public':
        return '公開';
      default:
        return '非公開';
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  const canCreateMore = userData?.membershipTier === 'premium' || 
    (userData?.generatedCount || 0) < 3;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">新聞管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            作成した新聞の一覧です。編集や共有、PDFダウンロードができます。
          </p>
          {userData?.membershipTier === 'free' && (
            <p className="mt-1 text-sm text-blue-600">
              今月の生成回数: {userData.generatedCount || 0}/3
            </p>
          )}
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          {canCreateMore ? (
            <Link href="/dashboard/newspapers/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新聞を作成
              </Button>
            </Link>
          ) : (
            <div className="text-right">
              <p className="text-sm text-red-600 mb-2">
                月間生成回数の上限に達しました
              </p>
              <Link href="/dashboard/upgrade">
                <Button>
                  プレミアムにアップグレード
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {newspapers.length === 0 ? (
        <div className="mt-8 text-center">
          <NewspaperIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">新聞がありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            論文を選択して最初の新聞を作成しましょう
          </p>
          {canCreateMore && (
            <div className="mt-6">
              <Link href="/dashboard/newspapers/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  最初の新聞を作成
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {newspapers.map((newspaper) => (
            <div
              key={newspaper.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
            >
              <Link href={`/dashboard/newspapers/${newspaper.id}`}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {newspaper.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 truncate">
                        {newspaper.content?.header?.newspaperName || '新聞'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {format(newspaper.createdAt.toDate(), 'yyyy年MM月dd日', { locale: ja })}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="flex items-center text-sm text-gray-500">
                        {getShareIcon(newspaper.shareSettings.type)}
                        <span className="ml-1">{getShareText(newspaper.shareSettings.type)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {newspaper.shareSettings.viewCount}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Share functionality
                          alert('共有機能は実装中です');
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Download functionality
                          alert('ダウンロード機能は実装中です');
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          deleteNewspaper(newspaper.id);
                        }}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}