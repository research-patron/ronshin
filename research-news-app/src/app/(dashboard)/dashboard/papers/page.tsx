'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Paper } from '@/types';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Plus, 
  Download,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function PapersPage() {
  const { currentUser } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchPapers();
    }
  }, [currentUser]);

  const fetchPapers = async () => {
    try {
      const papersQuery = query(
        collection(db, 'papers'),
        where('uploaderId', '==', currentUser!.uid),
        orderBy('createdAt', 'desc')
      );
      const papersSnapshot = await getDocs(papersQuery);
      const papersData = papersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Paper));
      setPapers(papersData);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePaper = async (paperId: string) => {
    if (!confirm('この論文を削除してもよろしいですか？')) return;
    
    try {
      await deleteDoc(doc(db, 'papers', paperId));
      setPapers(prev => prev.filter(p => p.id !== paperId));
    } catch (error) {
      console.error('Error deleting paper:', error);
      alert('論文の削除に失敗しました。');
    }
  };

  const getStatusIcon = (status: Paper['processingStatus']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: Paper['processingStatus']) => {
    switch (status) {
      case 'pending':
        return '処理待ち';
      case 'processing':
        return '処理中';
      case 'completed':
        return '完了';
      case 'failed':
        return 'エラー';
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">論文管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            アップロードした論文の一覧と解析状況を確認できます
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link href="/dashboard/papers/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              論文をアップロード
            </Button>
          </Link>
        </div>
      </div>

      {papers.length === 0 ? (
        <div className="mt-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">論文がありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            論文をアップロードして解析を開始しましょう
          </p>
          <div className="mt-6">
            <Link href="/dashboard/papers/upload">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                最初の論文をアップロード
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        タイトル
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        著者
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        ステータス
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        アップロード日
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {papers.map((paper) => (
                      <tr key={paper.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link href={`/dashboard/papers/view?id=${paper.id}`} className="hover:text-blue-600">
                            {paper.title}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {paper.authors.length > 0 ? paper.authors.join(', ') : '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            {getStatusIcon(paper.processingStatus)}
                            <span className="ml-2">{getStatusText(paper.processingStatus)}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(paper.createdAt.toDate(), 'yyyy/MM/dd', { locale: ja })}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/dashboard/papers/${paper.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePaper(paper.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}