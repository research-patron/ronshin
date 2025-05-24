'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, generateNewspaperFunction } from '@/lib/firebase';
import { Paper, Template } from '@/types';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle,
  Loader2,
  Info,
  Crown
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Image from 'next/image';

const steps = [
  { id: 1, name: '論文選択', description: '5つの論文を選択してください' },
  { id: 2, name: 'テンプレート選択', description: '新聞のデザインを選択' },
  { id: 3, name: '確認', description: '選択内容を確認' },
];

export default function CreateNewspaperPage() {
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch completed papers
      const papersQuery = query(
        collection(db, 'papers'),
        where('uploaderId', '==', currentUser!.uid),
        where('processingStatus', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
      const papersSnapshot = await getDocs(papersQuery);
      const papersData = papersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Paper));
      setPapers(papersData);

      // Fetch templates
      const templatesQuery = query(collection(db, 'templates'));
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesData = templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Template));
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  const handlePaperToggle = (paperId: string) => {
    setSelectedPapers(prev => {
      if (prev.includes(paperId)) {
        return prev.filter(id => id !== paperId);
      }
      if (prev.length < 5) {
        return [...prev, paperId];
      }
      return prev;
    });
  };

  const handleNext = () => {
    if (currentStep < 3) {
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
      const response = await fetch('/api/newspapers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser!.getIdToken()}`,
        },
        body: JSON.stringify({
          paperIds: selectedPapers,
          templateId: selectedTemplate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create newspaper');
      }

      const { newspaperId } = await response.json();
      
      // Trigger newspaper generation in Firebase Function
      try {
        await generateNewspaperFunction({ newspaperId });
        console.log('Newspaper generation triggered successfully');
      } catch (error) {
        console.error('Error triggering newspaper generation:', error);
        // Continue anyway - the generation can be retried later
      }
      
      router.push(`/dashboard/newspapers/${newspaperId}`);
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
        return selectedPapers.length === 5;
      case 2:
        return selectedTemplate !== '';
      case 3:
        return true;
      default:
        return false;
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
              論文を選択（{selectedPapers.length}/5）
            </h2>
            {papers.length < 5 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <Info className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      新聞を作成するには、解析済みの論文が5つ必要です。
                      現在{papers.length}つの論文が利用可能です。
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-colors
                    ${selectedPapers.includes(paper.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => handlePaperToggle(paper.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {paper.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {paper.authors.join(', ')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(paper.createdAt.toDate(), 'yyyy/MM/dd', { locale: ja })}
                      </p>
                    </div>
                    <div className="ml-4">
                      {selectedPapers.includes(paper.id) && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              内容確認
            </h2>
            <div className="bg-white shadow rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  選択した論文
                </h3>
                <ul className="space-y-2">
                  {selectedPapers.map((paperId) => {
                    const paper = papers.find(p => p.id === paperId);
                    return paper ? (
                      <li key={paperId} className="flex items-center text-sm text-gray-900">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        {paper.title}
                      </li>
                    ) : null;
                  })}
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
          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              次へ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
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