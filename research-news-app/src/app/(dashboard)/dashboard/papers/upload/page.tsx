'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function PaperUploadPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newFiles = selectedFiles
      .filter(file => file.type === 'application/pdf')
      .filter(file => file.size <= 20 * 1024 * 1024) // 20MB limit
      .map(file => ({
        id: uuidv4(),
        file,
        status: 'pending' as const,
        progress: 0,
      }));

    if (newFiles.length !== selectedFiles.length) {
      alert('PDFファイルのみ、20MB以下のファイルをアップロードできます。');
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'uploading' as const } 
          : f
      ));

      // Get auth token
      const token = await currentUser?.getIdToken();
      if (!token) {
        throw new Error('認証トークンが取得できませんでした');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', uploadedFile.file);

      // Upload via Cloud Function
      const response = await fetch('https://us-central1-ronshin-72b20.cloudfunctions.net/upload_paper_api', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload API error:', errorData);
        throw new Error(errorData.details || errorData.error || 'アップロードに失敗しました');
      }

      await response.json();

      // Update status to success
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'success' as const, progress: 100 } 
          : f
      ));
    } catch (error) {
      console.error('Upload error:', error);
      // Update status to error
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'アップロードに失敗しました' } 
          : f
      ));
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    
    try {
      // Upload all pending files
      const pendingFiles = files.filter(f => f.status === 'pending');
      await Promise.all(pendingFiles.map(uploadFile));
      
      // Redirect to papers list after successful upload
      setTimeout(() => {
        router.push('/dashboard/papers');
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    const newFiles = droppedFiles
      .filter(file => file.type === 'application/pdf')
      .filter(file => file.size <= 20 * 1024 * 1024)
      .map(file => ({
        id: uuidv4(),
        file,
        status: 'pending' as const,
        progress: 0,
      }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">論文をアップロード</h1>
          <p className="text-gray-600 mt-1">
            PDFファイルをアップロードして、AI解析を開始します（最大20MB）
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="mb-8"
        >
          <label
            htmlFor="file-upload"
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">
              クリックまたはドラッグ&ドロップでファイルを選択
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              PDF形式、最大20MB
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
            />
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              アップロードファイル一覧
            </h2>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'pending' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                    {file.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-xs text-red-500">{file.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/papers')}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.filter(f => f.status === 'pending').length === 0 || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                アップロード中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                アップロード
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}