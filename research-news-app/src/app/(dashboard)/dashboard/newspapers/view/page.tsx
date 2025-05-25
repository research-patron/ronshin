'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Newspaper } from '@/types';
import { Button } from '@/components/ui/Button';
import NewspaperViewer from '@/components/newspaper/NewspaperViewer';
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
  Clock,
  Printer
} from 'lucide-react';

export default function NewspaperViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const newspaperId = searchParams.get('id');
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'preview' | 'print'>('preview');

  useEffect(() => {
    if (!newspaperId) {
      router.push('/dashboard/newspapers');
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'newspapers', newspaperId),
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
  }, [newspaperId, router]);

  const handlePrint = () => {
    window.open(`/print/newspaper?id=${newspaperId}`, '_blank');
  };

  const handleDownloadPDF = () => {
    // PDF download functionality
    alert('PDF ダウンロード機能は実装中です');
  };

  const handleShare = () => {
    // Share functionality
    alert('共有機能は実装中です');
  };

  const getShareIcon = (type: string) => {
    switch (type) {
      case 'private':
        return <Lock className="h-5 w-5 text-gray-500" />;
      case 'public':
        return <Globe className="h-5 w-5 text-green-500" />;
      case 'group':
        return <Users className="h-5 w-5 text-blue-500" />;
      default:
        return <Lock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <Eye className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!newspaper) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/newspapers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            新聞一覧に戻る
          </Button>
          
          <div className="flex items-center space-x-2">
            {getShareIcon(newspaper.shareSettings?.type || 'private')}
            {getStatusIcon(newspaper.processingStatus)}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={handlePrint}
            variant="outline"
          >
            <Printer className="mr-2 h-4 w-4" />
            印刷
          </Button>
          
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            PDFダウンロード
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
          >
            <Share2 className="mr-2 h-4 w-4" />
            共有
          </Button>
          
          {newspaper.creatorId === newspaper.creatorId && (
            <Button
              onClick={() => alert('編集機能は実装中です')}
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          )}
        </div>

        {/* Newspaper Viewer */}
        {newspaper.processingStatus === 'completed' && newspaper.content ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <NewspaperViewer 
              newspaper={newspaper} 
              isPreview={viewMode === 'preview'} 
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            {newspaper.processingStatus === 'processing' ? (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-lg text-gray-600">
                  新聞を生成中です...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  しばらくお待ちください
                </p>
              </>
            ) : newspaper.processingStatus === 'failed' ? (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <p className="text-lg text-gray-600">
                  新聞の生成に失敗しました
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  もう一度お試しください
                </p>
              </>
            ) : (
              <>
                <Clock className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <p className="text-lg text-gray-600">
                  処理待ち
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}