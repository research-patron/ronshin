'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { generateHeadline as generateAIHeadline } from '@/lib/utils/vertex-ai-client';

/**
 * 新聞エディタのカスタムフック
 * 新聞データの取得、更新、AIによる見出し生成などの機能を提供
 */
export function useNewspaperEditor(
  newspaperId?: string,
  paperId?: string,
  templateId?: string,
  userId?: string
) {
  // 状態管理
  const [newspaper, setNewspaper] = useState<any>(null);
  const [originalNewspaper, setOriginalNewspaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isGeneratingHeadline, setIsGeneratingHeadline] = useState(false);

  // データの初期読み込み
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (newspaperId) {
          // 既存の新聞データを取得
          const newspaperDoc = await getDoc(doc(db, 'newspapers', newspaperId));
          
          if (newspaperDoc.exists()) {
            const newspaperData = newspaperDoc.data();
            setNewspaper(newspaperData);
            setOriginalNewspaper(newspaperData);
          } else {
            throw new Error('新聞データが見つかりません');
          }
        } else if (paperId && templateId && userId) {
          // 新規作成の場合は初期データを設定
          const paperDoc = await getDoc(doc(db, 'papers', paperId));
          const templateDoc = await getDoc(doc(db, 'newspaperTemplates', templateId));
          
          if (!paperDoc.exists()) {
            throw new Error('指定された論文が見つかりません');
          }
          
          if (!templateDoc.exists()) {
            throw new Error('指定されたテンプレートが見つかりません');
          }
          
          const paperData = paperDoc.data();
          const templateData = templateDoc.data();
          
          // デフォルトの新聞データを作成
          const defaultNewspaper = {
            paperId,
            templateId,
            userId,
            status: 'draft',
            content: {
              headline: {
                main: paperData.title || '新しい研究',
                sub: `${paperData.aiAnalysis?.academicField || ''}分野の最新研究`
              },
              content: {
                lead: paperData.aiAnalysis?.abstract?.substring(0, 150) || '',
                body: '',
                conclusion: paperData.aiAnalysis?.significance || ''
              },
              sideInfo: {
                keywords: paperData.aiAnalysis?.keywords || [],
                futureImplications: ''
              }
            },
            style: {
              fontFamily: '"Noto Serif JP", serif',
              textDirection: 'vertical-rl',
              headlineFontSize: '32px',
              bodyFontSize: '16px',
              colorScheme: 'classic',
              backgroundColor: '#f5f5dc',
              textColor: '#000000',
              headlineBackgroundColor: '#f0f0d8',
              borderColor: '#8b4513',
              columnCount: '1'
            },
            metadata: {
              title: `${paperData.title || '無題'} - 新聞`,
              description: '',
              paperTitle: paperData.title || '',
              paperAuthors: paperData.authors || [],
              templateName: templateData.name || '',
              createdAt: new Date().toISOString()
            }
          };
          
          setNewspaper(defaultNewspaper);
          setOriginalNewspaper(defaultNewspaper);
        } else {
          throw new Error('必要なパラメータが不足しています');
        }
      } catch (err: any) {
        console.error('Error fetching newspaper data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [newspaperId, paperId, templateId, userId]);

  // AIによる見出し生成
  const generateHeadline = async () => {
    if (!newspaper) return;
    
    setIsGeneratingHeadline(true);
    setError(null);
    
    try {
      // 記事の内容から見出しを生成
      const content = newspaper.content.content.body || newspaper.content.content.lead || '';
      
      if (!content.trim()) {
        throw new Error('見出しを生成するには記事の内容が必要です');
      }
      
      const headlineResult = await generateAIHeadline(content);
      
      // 生成された見出しを設定
      setNewspaper((prev: any) => ({
        ...prev,
        content: {
          ...prev.content,
          headline: {
            main: headlineResult.main,
            sub: headlineResult.sub
          }
        }
      }));
      
      return headlineResult;
    } catch (err: any) {
      console.error('Error generating headline:', err);
      setError(`見出し生成エラー: ${err.message}`);
      throw err;
    } finally {
      setIsGeneratingHeadline(false);
    }
  };

  // 新聞データの保存
  const saveNewspaper = async () => {
    if (!newspaper) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      if (newspaperId) {
        // 既存の新聞データを更新
        await updateDoc(doc(db, 'newspapers', newspaperId), {
          ...newspaper,
          updatedAt: serverTimestamp()
        });
      } else {
        // 新規作成
        if (!userId) {
          throw new Error('ユーザーIDが必要です');
        }
        
        const newNewspaperRef = await addDoc(collection(db, 'newspapers'), {
          ...newspaper,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // 新しいIDを設定
        setNewspaper((prev: any) => ({
          ...prev,
          id: newNewspaperRef.id
        }));
      }
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Error saving newspaper:', err);
      setError(`保存エラー: ${err.message}`);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // 変更されたかどうかを確認
  const hasChanges = () => {
    return JSON.stringify(newspaper) !== JSON.stringify(originalNewspaper);
  };

  return {
    newspaper,
    setNewspaper,
    loading,
    saving,
    error,
    success,
    generateHeadline,
    saveNewspaper,
    isGeneratingHeadline,
    hasChanges
  };
}