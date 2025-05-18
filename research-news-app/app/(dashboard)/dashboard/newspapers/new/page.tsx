'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import EnhancedNewspaperEditor from '@/components/newspaper/EnhancedNewspaperEditor';
import { useAuth } from '@/lib/auth/auth-provider';
import { getDocumentById } from '@/lib/firebase/firestore';

/**
 * 新規新聞作成ページ
 * URLパラメータで論文IDとテンプレートIDを受け取り、新しい新聞を作成
 */
export default function NewNewspaperPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  // URLパラメータから値を取得
  const paperId = searchParams.get('paperId');
  const templateId = searchParams.get('templateId') || 'classic'; // デフォルトテンプレート
  
  const [paperData, setPaperData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 論文データの取得
  useEffect(() => {
    const fetchPaperData = async () => {
      if (!paperId) {
        setError('論文IDが指定されていません');
        setLoading(false);
        return;
      }
      
      try {
        const paper = await getDocumentById('papers', paperId);
        
        if (!paper) {
          setError('指定された論文が見つかりません');
          return;
        }
        
        // 解析が完了しているか確認
        if (paper.processingStatus !== 'completed') {
          setError('論文の解析が完了していません。解析完了後に新聞を作成してください。');
          return;
        }
        
        setPaperData(paper);
      } catch (err: any) {
        console.error('Error fetching paper:', err);
        setError(`論文データの取得に失敗しました: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading && user) {
      fetchPaperData();
    }
  }, [paperId, user, authLoading]);

  // 保存成功時の処理
  const handleSaveSuccess = (newspaper: any) => {
    // 新聞詳細ページへリダイレクト
    router.push(`/dashboard/newspapers/${newspaper.id}`);
  };

  // 認証中はローディング表示
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 未ログインの場合はログインページへリダイレクト
  if (!authLoading && !user) {
    router.push('/login?redirect=/dashboard/newspapers/new');
    return null;
  }

  // 論文データ取得中はローディング表示
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // エラーがある場合はエラーメッセージを表示
  if (error) {
    return (
      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          新聞作成エラー
        </Typography>
        <Typography color="error" paragraph>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => router.push('/dashboard/papers')}
        >
          論文一覧に戻る
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h5" component="h1" gutterBottom>
        新しい新聞を作成
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        論文: {paperData?.title}
      </Typography>
      
      <EnhancedNewspaperEditor
        paperId={paperId as string}
        templateId={templateId}
        userId={user?.uid as string}
        onSave={handleSaveSuccess}
        onError={(err) => setError(err.message)}
      />
    </Box>
  );
}