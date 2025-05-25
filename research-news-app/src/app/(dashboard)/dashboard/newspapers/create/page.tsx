'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { storage, db, analyzePaperFunction, generateNewspaperFunction } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Template } from '@/types';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle,
  Loader2,
  Info,
  Crown,
  Upload,
  X,
  AlertCircle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'analyzing' | 'success' | 'error';
  progress: number;
  error?: string;
  paperId?: string;
}

const steps = [
  { id: 1, name: '論文アップロード', description: '3〜5つの論文PDFをアップロード' },
  { id: 2, name: 'テンプレート選択', description: '新聞のデザインを選択' },
  { id: 3, name: '設定', description: '言語とその他の設定' },
  { id: 4, name: '確認', description: '選択内容を確認' },
];

export default function CreateNewspaperPage() {
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'ja' | 'en'>('ja');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [analyzedPaperIds, setAnalyzedPaperIds] = useState<string[]>([]);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesQuery = query(collection(db, 'templates'));
        const templatesSnapshot = await getDocs(templatesQuery);
        const templatesData = templatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Template));
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    fetchTemplates();
  }, []);

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

    // Check total file count
    if (files.length + newFiles.length > 5) {
      alert('最大5つまでのファイルをアップロードできます。');
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadAndAnalyzeFiles = async () => {
    setUploadingFiles(true);
    const paperIds: string[] = [];

    try {
      for (const uploadedFile of files) {
        if (uploadedFile.status === 'success' && uploadedFile.paperId) {
          paperIds.push(uploadedFile.paperId);
          continue;
        }

        try {
          // Update status to uploading
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'uploading' as const } 
              : f
          ));

          // Create storage reference
          const storageRef = ref(storage, `papers/${currentUser!.uid}/${uploadedFile.id}.pdf`);
          
          // Upload file
          const snapshot = await uploadBytes(storageRef, uploadedFile.file);
          const downloadURL = await getDownloadURL(snapshot.ref);

          // Create paper document in Firestore
          const paperRef = await addDoc(collection(db, 'papers'), {
            uploaderId: currentUser!.uid,
            title: uploadedFile.file.name.replace('.pdf', ''),
            authors: [],
            fileUrl: downloadURL,
            fileSize: uploadedFile.file.size,
            processingStatus: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // Update status to analyzing
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'analyzing' as const, paperId: paperRef.id } 
              : f
          ));

          // Trigger AI analysis
          try {
            const result = await analyzePaperFunction({ 
              paper_id: paperRef.id,
              file_url: downloadURL,
              uploader_id: currentUser!.uid,
              language: selectedLanguage
            });
            console.log('Analysis function result:', result);
          } catch (functionError: any) {
            console.error('Function call error:', functionError);
            console.error('Error code:', functionError.code);
            console.error('Error message:', functionError.message);
            console.error('Error details:', functionError.details);
            throw functionError;
          }

          // Listen for processing status updates
          const unsubscribe = onSnapshot(doc(db, 'papers', paperRef.id), (snapshot) => {
            const data = snapshot.data();
            if (data?.processingStatus === 'completed') {
              setFiles(prev => prev.map(f => 
                f.id === uploadedFile.id 
                  ? { ...f, status: 'success' as const, progress: 100 } 
                  : f
              ));
              paperIds.push(paperRef.id);
              unsubscribe();
            } else if (data?.processingStatus === 'failed') {
              setFiles(prev => prev.map(f => 
                f.id === uploadedFile.id 
                  ? { ...f, status: 'error' as const, error: '解析に失敗しました' } 
                  : f
              ));
              unsubscribe();
            }
          });

          // Wait for processing (with timeout)
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Processing timeout'));
            }, 60000); // 60 seconds timeout

            const checkStatus = setInterval(async () => {
              const paperDoc = await getDoc(doc(db, 'papers', paperRef.id));
              const status = paperDoc.data()?.processingStatus;
              
              if (status === 'completed') {
                clearInterval(checkStatus);
                clearTimeout(timeout);
                resolve(paperRef.id);
              } else if (status === 'failed') {
                clearInterval(checkStatus);
                clearTimeout(timeout);
                reject(new Error('Processing failed'));
              }
            }, 2000); // Check every 2 seconds
          });

        } catch (error) {
          console.error('Upload/analysis error:', error);
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'error' as const, error: 'アップロードまたは解析に失敗しました' } 
              : f
          ));
        }
      }

      setAnalyzedPaperIds(paperIds);
      
      if (paperIds.length >= 3) {
        // Auto proceed to next step if we have enough papers
        handleNext();
      }
    } finally {
      setUploadingFiles(false);
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

    if (files.length + newFiles.length > 5) {
      alert('最大5つまでのファイルをアップロードできます。');
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch('https://us-central1-ronshin-72b20.cloudfunctions.net/create_newspaper_api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser!.getIdToken()}`,
        },
        body: JSON.stringify({
          selectedPapers: analyzedPaperIds,
          templateId: selectedTemplate,
          newspaperName: `研究新聞 ${new Date().toLocaleDateString('ja-JP')}`,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create newspaper');
      }

      const { newspaperId } = await response.json();
      
      // Trigger newspaper generation in Firebase Function
      try {
        await generateNewspaperFunction({ 
          newspaper_id: newspaperId 
        });
        console.log('Newspaper generation triggered successfully');
      } catch (error) {
        console.error('Error triggering newspaper generation:', error);
        // Continue anyway - the generation can be retried later
      }
      
      router.push('/dashboard/newspapers');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '新聞の作成に失敗しました';
      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        const successfulFiles = files.filter(f => f.status === 'success').length;
        return files.length >= 3 && files.length <= 5 && successfulFiles === files.length;
      case 2:
        return selectedTemplate !== '';
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const shouldShowProceedButton = () => {
    if (currentStep === 1) {
      return files.length > 0 && !uploadingFiles;
    }
    return true;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/newspapers')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          新聞一覧に戻る
        </Button>
      </div>

      {/* Progress Steps */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center justify-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}>
              <div className="flex items-center">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-full
                  ${step.id < currentStep ? 'bg-blue-600' : ''}
                  ${step.id === currentStep ? 'border-2 border-blue-600' : ''}
                  ${step.id > currentStep ? 'border-2 border-gray-300' : ''}
                `}>
                  {step.id < currentStep ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <span className={`
                      ${step.id === currentStep ? 'text-blue-600' : 'text-gray-500'}
                    `}>
                      {step.id}
                    </span>
                  )}
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${
                    step.id === currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              論文PDFをアップロード（{files.length}/3-5）
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    3〜5つの論文PDFをアップロードしてください。アップロード後、自動的にAI解析が行われます。
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="mb-6"
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
                  disabled={files.length >= 5}
                />
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
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
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          <span className="text-xs text-blue-500">アップロード中...</span>
                        </div>
                      )}
                      {file.status === 'analyzing' && (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                          <span className="text-xs text-yellow-500">解析中...</span>
                        </div>
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
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              テンプレートを選択
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`
                    relative border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedTemplate === template.id 
                      ? 'border-blue-500 ring-2 ring-blue-500' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${template.isPremium && userData?.membershipTier === 'free' 
                      ? 'opacity-60 cursor-not-allowed' 
                      : ''
                    }
                  `}
                  onClick={() => {
                    if (!template.isPremium || userData?.membershipTier === 'premium') {
                      setSelectedTemplate(template.id);
                    }
                  }}
                >
                  {template.isPremium && (
                    <div className="absolute top-2 right-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </div>
                  )}
                  <div className="aspect-w-3 aspect-h-4 mb-3 relative h-32">
                    <Image
                      src={template.previewImageUrl || '/placeholder-template.png'}
                      alt={template.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {template.description}
                  </p>
                  {template.isPremium && userData?.membershipTier === 'free' && (
                    <p className="text-xs text-yellow-600 mt-2">
                      プレミアム会員限定
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              設定
            </h2>
            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  新聞の言語
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="language"
                      value="ja"
                      checked={selectedLanguage === 'ja'}
                      onChange={() => setSelectedLanguage('ja')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">日本語</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="language"
                      value="en"
                      checked={selectedLanguage === 'en'}
                      onChange={() => setSelectedLanguage('en')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">English</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              内容確認
            </h2>
            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  アップロードした論文
                </h3>
                <ul className="space-y-2">
                  {files.filter(f => f.status === 'success').map((file) => (
                    <li key={file.id} className="flex items-center text-sm text-gray-900">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      {file.file.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  選択したテンプレート
                </h3>
                <p className="text-sm text-gray-900">
                  {templates.find(t => t.id === selectedTemplate)?.name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  言語設定
                </h3>
                <p className="text-sm text-gray-900">
                  {selectedLanguage === 'ja' ? '日本語' : 'English'}
                </p>
              </div>
              {userData?.membershipTier === 'free' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    今月の生成回数: {userData.generatedCount + 1}/3
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          
          {currentStep === 1 && files.length > 0 && !canProceed() && (
            <Button
              onClick={uploadAndAnalyzeFiles}
              disabled={uploadingFiles || files.length < 3}
            >
              {uploadingFiles ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  アップロードして解析
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
          
          {(currentStep > 1 || (currentStep === 1 && canProceed())) && currentStep < 4 && (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              次へ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          {currentStep === 4 && (
            <Button
              onClick={handleCreate}
              disabled={creating || !canProceed()}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                '新聞を作成'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}