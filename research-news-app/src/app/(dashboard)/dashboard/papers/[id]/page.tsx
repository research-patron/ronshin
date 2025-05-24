'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function PaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaper();
  }, [params.id]);

  const fetchPaper = async () => {
    try {
      const paperDoc = await getDoc(doc(db, 'papers', params.id as string));
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

  const getStatusText = (status: Paper['processingStatus']) => {
    switch (status) {
      case 'pending':
        return '解析待機中';
      case 'processing':
        return '解析処理中';
      case 'completed':
        return '解析完了';
      case 'failed':
        return '解析エラー';
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
          variant="ghost"
          onClick={() => router.push('/dashboard/papers')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          論文一覧に戻る
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{paper.title}</h1>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {format(paper.createdAt.toDate(), 'yyyy年MM月dd日', { locale: ja })}
                </div>
                <div className="flex items-center">
                  {getStatusIcon(paper.processingStatus)}
                  <span className="ml-1">{getStatusText(paper.processingStatus)}</span>
                </div>
              </div>
            </div>
            <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                PDFをダウンロード
              </Button>
            </a>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">基本情報</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  著者
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {paper.authors.length > 0 ? paper.authors.join(', ') : '未設定'}
                </dd>
              </div>
              {paper.journal && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    ジャーナル
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{paper.journal}</dd>
                </div>
              )}
              {paper.publicationDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    出版日
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{paper.publicationDate}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  ファイルサイズ
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(paper.fileSize / 1024 / 1024).toFixed(2)} MB
                </dd>
              </div>
            </dl>
          </div>

          {/* AI Analysis */}
          {paper.processingStatus === 'completed' && paper.aiAnalysis && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">AI解析結果</h2>
                
                {/* Summary */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">要約</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4">
                    {paper.aiAnalysis.summary}
                  </p>
                </div>

                {/* Key Points */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">重要ポイント</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {paper.aiAnalysis.keypoints.map((point, index) => (
                      <li key={index} className="text-sm text-gray-900">{point}</li>
                    ))}
                  </ul>
                </div>

                {/* Significance */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">研究の意義</h3>
                  <p className="text-sm text-gray-900 bg-blue-50 rounded-lg p-4">
                    {paper.aiAnalysis.significance}
                  </p>
                </div>

                {/* Related Topics */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Tag className="mr-2 h-4 w-4" />
                    関連トピック
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.aiAnalysis.relatedTopics.map((topic, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Academic Field & Technical Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">学術分野</h3>
                    <p className="text-sm text-gray-900">{paper.aiAnalysis.academicField}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">技術レベル</h3>
                    <p className="text-sm text-gray-900">
                      {paper.aiAnalysis.technicalLevel === 'beginner' && '初級'}
                      {paper.aiAnalysis.technicalLevel === 'intermediate' && '中級'}
                      {paper.aiAnalysis.technicalLevel === 'advanced' && '上級'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              {paper.metadata?.keywords && paper.metadata.keywords.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">キーワード</h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.metadata.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Processing Status Messages */}
          {paper.processingStatus === 'pending' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex">
                  <Clock className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      この論文は解析待機中です。しばらくお待ちください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paper.processingStatus === 'processing' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex">
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      AI解析を実行中です。完了まで数分かかる場合があります。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paper.processingStatus === 'failed' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      解析中にエラーが発生しました。サポートにお問い合わせください。
                    </p>
                    {paper.errorLogs && paper.errorLogs.length > 0 && (
                      <p className="text-xs text-red-600 mt-2">
                        エラー: {paper.errorLogs[0].message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}