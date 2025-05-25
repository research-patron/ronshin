'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paper } from '@/types';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  Users,
  Tag,
  BookOpen,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function PaperViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paperId = searchParams.get('id');
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paperId) {
      fetchPaper();
    } else {
      router.push('/dashboard/papers');
    }
  }, [paperId]);

  const fetchPaper = async () => {
    if (!paperId) return;
    
    try {
      const paperDoc = await getDoc(doc(db, 'papers', paperId));
      if (paperDoc.exists()) {
        setPaper({ id: paperDoc.id, ...paperDoc.data() } as Paper);
      } else {
        router.push('/dashboard/papers');
      }
    } catch (error) {
      console.error('Error fetching paper:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Paper['processingStatus']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
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

  if (!paper) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/papers')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          論文一覧に戻る
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{paper.title}</h1>
            {getStatusIcon(paper.processingStatus)}
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                著者
              </h3>
              <p className="text-gray-900">
                {paper.authors?.length > 0 ? paper.authors.join(', ') : '未設定'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                アップロード日
              </h3>
              <p className="text-gray-900">
                {format(paper.createdAt.toDate(), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
              </p>
            </div>

            {paper.journal && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  <BookOpen className="inline h-4 w-4 mr-1" />
                  ジャーナル
                </h3>
                <p className="text-gray-900">{paper.journal}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                ファイルサイズ
              </h3>
              <p className="text-gray-900">
                {(paper.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {/* Keywords from metadata */}
          {paper.metadata?.keywords && paper.metadata.keywords.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                キーワード
              </h3>
              <div className="flex flex-wrap gap-2">
                {paper.metadata.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {paper.aiAnalysis && paper.processingStatus === 'completed' && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI分析結果</h2>
              
              <div className="space-y-4">
                {paper.aiAnalysis.summary && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">要約</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {paper.aiAnalysis.summary}
                    </p>
                  </div>
                )}

                {paper.aiAnalysis.keypoints && paper.aiAnalysis.keypoints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      重要ポイント
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {paper.aiAnalysis.keypoints.map((point, index) => (
                        <li key={index} className="text-gray-900">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {paper.aiAnalysis.significance && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">研究の意義</h3>
                    <p className="text-gray-900">{paper.aiAnalysis.significance}</p>
                  </div>
                )}

                {paper.aiAnalysis.relatedTopics && paper.aiAnalysis.relatedTopics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      <Tag className="inline h-4 w-4 mr-1" />
                      関連トピック
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {paper.aiAnalysis.relatedTopics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-6">
            <div className="flex space-x-4">
              <Button
                onClick={() => window.open(paper.fileUrl, '_blank')}
                disabled={!paper.fileUrl}
              >
                <Download className="mr-2 h-4 w-4" />
                PDFをダウンロード
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}