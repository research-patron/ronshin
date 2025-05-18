import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Newspaper } from '@/lib/utils/newspaper-utils';
import { generateHeadline } from '@/lib/utils/vertex-ai-client';

interface UseNewspaperEditorProps {
  newspaperId: string;
  userId: string;
}

interface UseNewspaperEditorReturn {
  newspaper: Newspaper | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  hasChanges: boolean;
  saving: boolean;
  setNewspaper: (newspaper: Newspaper) => void;
  saveNewspaper: () => Promise<void>;
  generateHeadlines: () => Promise<Array<{main: string, sub?: string}>>;
}

export default function useNewspaperEditor({ 
  newspaperId, 
  userId 
}: UseNewspaperEditorProps): UseNewspaperEditorReturn {
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);
  const [originalNewspaper, setOriginalNewspaper] = useState<Newspaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch newspaper data
  useEffect(() => {
    const fetchNewspaperData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const newspaperDocRef = doc(db, 'newspapers', newspaperId);
        const newspaperDoc = await getDoc(newspaperDocRef);
        
        if (!newspaperDoc.exists()) {
          setError('新聞データが見つかりません');
          setLoading(false);
          return;
        }
        
        const newspaperData = newspaperDoc.data() as Newspaper;
        
        // Verify ownership
        if (newspaperData.creatorId !== userId) {
          setError('このコンテンツを編集する権限がありません');
          setLoading(false);
          return;
        }
        
        setNewspaper(newspaperData);
        setOriginalNewspaper(JSON.parse(JSON.stringify(newspaperData))); // Deep copy
        setLoading(false);
      } catch (error) {
        console.error('Error fetching newspaper:', error);
        setError('新聞データの取得中にエラーが発生しました');
        setLoading(false);
      }
    };
    
    fetchNewspaperData();
  }, [newspaperId, userId]);
  
  // Detect changes
  useEffect(() => {
    if (originalNewspaper && newspaper) {
      try {
        // Compare only necessary fields
        const tagsChanged = 
          JSON.stringify(newspaper.tags || []) !== 
          JSON.stringify(originalNewspaper.tags || []);
          
        const isChanged = 
          newspaper.title !== originalNewspaper.title ||
          JSON.stringify(newspaper.content) !== JSON.stringify(originalNewspaper.content) ||
          JSON.stringify(newspaper.customSettings) !== JSON.stringify(originalNewspaper.customSettings) ||
          tagsChanged;
        
        setHasChanges(isChanged);
      } catch (error) {
        console.error('Error checking changes:', error);
      }
    }
  }, [newspaper, originalNewspaper]);

  // Save newspaper function
  const saveNewspaper = async () => {
    if (!newspaper) {
      setError('保存するデータがありません');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Save to Firestore
      const newspaperDocRef = doc(db, 'newspapers', newspaperId);
      await updateDoc(newspaperDocRef, {
        title: newspaper.title,
        content: newspaper.content,
        customSettings: newspaper.customSettings,
        tags: newspaper.tags || [],
        updatedAt: serverTimestamp()
      });
      
      // Success message
      setSuccess('変更を保存しました');
      
      // Update original
      setOriginalNewspaper(JSON.parse(JSON.stringify(newspaper)));
      setSaving(false);
    } catch (error) {
      console.error('Error saving newspaper:', error);
      setError('変更の保存中にエラーが発生しました');
      setSaving(false);
    }
  };
  
  // Generate headlines with AI
  const generateHeadlines = async (): Promise<Array<{main: string, sub?: string}>> => {
    if (!newspaper) {
      throw new Error('新聞データがありません');
    }
    
    try {
      setError(null);
      
      // Get content from main article
      const content = newspaper.content.mainArticle.content;
      
      if (!content || content.trim().length < 100) {
        throw new Error('見出し生成には少なくとも100文字以上の本文が必要です');
      }
      
      // Call the Vertex AI API to generate headline
      const headline = await generateHeadline(content);
      
      // Generate multiple headline options
      // In a real application, this would be handled differently - either with multiple API calls
      // or a single call that returns multiple options
      const headlineOptions = [
        { main: headline.main, sub: headline.sub },
        { main: `【速報】${headline.main.replace(/。/g, '')}`, sub: headline.sub },
        { main: `研究成果：${headline.main.replace(/。/g, '')}`, sub: headline.sub },
      ];
      
      return headlineOptions;
    } catch (error) {
      console.error('Error generating headlines:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('見出しの生成中にエラーが発生しました');
      }
      throw error;
    }
  };

  return {
    newspaper,
    loading,
    error,
    success,
    hasChanges,
    saving,
    setNewspaper,
    saveNewspaper,
    generateHeadlines
  };
}