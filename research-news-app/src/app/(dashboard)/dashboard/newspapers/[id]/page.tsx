'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Newspaper } from '@/types';
import { Button } from '@/components/ui/Button';
import NewspaperViewer from '@/components/newspaper/NewspaperViewer';
import Link from 'next/link';
import { 
  ArrowLeft,
  Download,
  Share2,
  Edit,
  Eye,
  Loader2,
  Lock,
  Globe,
  Users,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function NewspaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'preview' | 'print'>('preview');

  useEffect(() => {
    // Use real-time listener to track status changes
    const unsubscribe = onSnapshot(
      doc(db, 'newspapers', params.id as string),
      (doc) => {
        if (doc.exists()) {
          setNewspaper({ id: doc.id, ...doc.data() } as Newspaper);
        } else {
          router.push('/dashboard/newspapers');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching newspaper:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [params.id, router]);

  const handleExportPDF = async () => {
    // PDF export functionality
    alert('PDF出力機能は実装中です');
  };

  const handleShare = () => {
    // Share functionality
    alert('共有機能は実装中です');
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

  if (!newspaper) {
    return null;
  }

  // Show processing status if newspaper is not ready
  if (newspaper.processingStatus !== 'completed') {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/newspapers')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          新聞一覧に戻る
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center">
              {newspaper.processingStatus === 'processing' ? (
                <>
                  <Clock className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    新聞を生成中...
                  </h2>
                  <p className="text-gray-500 mb-6">
                    AI が論文を分析し、新聞を作成しています。<br />
                    この処理には数分かかる場合があります。
                  </p>
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-500" />
                </>
              ) : newspaper.processingStatus === 'failed' ? (
                <>
                  <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    生成エラー
                  </h2>
                  <p className="text-gray-500 mb-6">
                    新聞の生成中にエラーが発生しました。<br />
                    {newspaper.processingError || 'もう一度お試しください。'}
                  </p>
                  <Button onClick={() => router.push('/dashboard/newspapers')}>
                    新聞一覧に戻る
                  </Button>
                </>
              ) : (
                <>
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    準備中...
                  </h2>
                  <p className="text-gray-500">
                    新聞の生成を開始しています。
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/newspapers')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          新聞一覧に戻る
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{newspaper.title}</h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                {getShareIcon(newspaper.shareSettings.type)}
                <span className="ml-1">{getShareText(newspaper.shareSettings.type)}</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {newspaper.shareSettings.viewCount} 回閲覧
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              共有
            </Button>
            <Link href={`/dashboard/newspapers/${newspaper.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Button>
            </Link>
            <Button onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDFダウンロード
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setViewMode('preview')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm
              ${viewMode === 'preview' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            プレビュー
          </button>
          <button
            onClick={() => setViewMode('print')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm
              ${viewMode === 'print' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            印刷プレビュー
          </button>
        </nav>
      </div>

      {/* Newspaper Content */}
      <div className={`
        ${viewMode === 'print' ? 'print-preview' : ''}
        bg-white shadow-lg rounded-lg overflow-hidden
      `}>
        <div className="p-8">
          <NewspaperViewer newspaper={newspaper} isPreview={viewMode === 'preview'} />
        </div>
      </div>

      {/* Print Preview Styles */}
      <style jsx>{`
        .print-preview {
          width: 297mm;
          min-height: 420mm;
          margin: 0 auto;
        }
        
        @media print {
          .print-preview {
            margin: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}