'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getTemplateById } from '@/lib/templates/newspaper-templates';

interface NewspaperPrintPageProps {
  params: {
    id: string;
  };
}

/**
 * 印刷用の新聞表示ページ
 * シンプルなレイアウトで新聞コンテンツのみを表示し、印刷に最適化
 */
export default function NewspaperPrintPage({ params }: NewspaperPrintPageProps) {
  const router = useRouter();
  const newspaperId = params.id;
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 状態管理
  const [newspaper, setNewspaper] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 新聞データを取得
  useEffect(() => {
    const fetchNewspaperData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 新聞データを取得
        const newspaperDocRef = doc(db, 'newspapers', newspaperId);
        const newspaperDoc = await getDoc(newspaperDocRef);
        
        if (!newspaperDoc.exists()) {
          setError('指定された新聞が見つかりません');
          setLoading(false);
          return;
        }
        
        const newspaperData = newspaperDoc.data();
        setNewspaper(newspaperData);
        
        // テンプレートを取得
        if (newspaperData.templateId) {
          const templateData = getTemplateById(newspaperData.templateId);
          setTemplate(templateData);
        }
      } catch (error) {
        console.error('Error fetching newspaper:', error);
        setError('新聞データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNewspaperData();
  }, [newspaperId]);
  
  // 印刷処理
  useEffect(() => {
    // データが読み込まれて印刷モードの場合は自動的に印刷ダイアログを表示
    if (!loading && newspaper && window.location.search.includes('print=true')) {
      // CSSの適用を待ってから印刷
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [loading, newspaper]);
  
  // ローディング表示
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // エラー表示
  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          戻る
        </Button>
      </Box>
    );
  }
  
  // 新聞データがない場合
  if (!newspaper) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="warning">新聞データが読み込めませんでした</Alert>
        <Button 
          variant="contained" 
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          戻る
        </Button>
      </Box>
    );
  }
  
  // 印刷スタイル
  const printStyles = {
    '@media print': {
      body: {
        margin: 0,
        padding: 0
      },
      '.no-print': {
        display: 'none !important'
      }
    }
  };
  
  return (
    <>
      {/* 印刷スタイルの適用 */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .newspaper-content {
            width: 100%;
            max-width: none;
            margin: 0;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>
      
      {/* 印刷しない操作ボタン */}
      <Box className="no-print" sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => router.back()}>
          戻る
        </Button>
        <Button variant="contained" onClick={() => window.print()}>
          印刷
        </Button>
      </Box>
      
      {/* 新聞コンテンツ */}
      <Box 
        ref={contentRef}
        className="newspaper-content"
        sx={{ 
          width: '100%', 
          maxWidth: '210mm', 
          margin: '0 auto', 
          p: 3,
          backgroundColor: newspaper.style?.backgroundColor || '#f5f5dc',
          color: newspaper.style?.textColor || '#000000',
          fontFamily: newspaper.style?.fontFamily || '"Noto Serif JP", serif',
          border: newspaper.style?.borderColor ? `1px solid ${newspaper.style.borderColor}` : '1px solid #8b4513',
        }}
      >
        {/* 新聞ヘッダー */}
        <Box sx={{ 
          mb: 2, 
          pb: 1, 
          borderBottom: newspaper.style?.borderColor ? `2px solid ${newspaper.style.borderColor}` : '2px solid #8b4513'
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          >
            {newspaper.metadata?.title || '新聞タイトル'}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2">
              {new Date(newspaper.createdAt?.toDate() || newspaper.createdAt || Date.now()).toLocaleDateString('ja-JP')}
            </Typography>
            <Typography variant="body2">
              {newspaper.metadata?.publisher || ''}
            </Typography>
          </Box>
        </Box>
        
        {/* メイン見出し */}
        <Box sx={{ 
          mb: 2, 
          p: 1, 
          backgroundColor: newspaper.style?.headlineBackgroundColor || '#f0f0d8',
          borderLeft: newspaper.style?.borderColor ? `4px solid ${newspaper.style.borderColor}` : '4px solid #8b4513',
          borderRight: newspaper.style?.borderColor ? `4px solid ${newspaper.style.borderColor}` : '4px solid #8b4513',
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontSize: newspaper.style?.headlineFontSize || '32px',
              fontWeight: 'bold',
              mb: 1,
              writingMode: newspaper.style?.textDirection === 'vertical-rl' || newspaper.style?.textDirection === 'vertical-lr' 
                ? newspaper.style.textDirection 
                : 'horizontal-tb'
            }}
          >
            {newspaper.content?.headline?.main || 'メイン見出し'}
          </Typography>
          
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: '1.2rem',
              writingMode: newspaper.style?.textDirection === 'vertical-rl' || newspaper.style?.textDirection === 'vertical-lr' 
                ? newspaper.style.textDirection 
                : 'horizontal-tb'
            }}
          >
            {newspaper.content?.headline?.sub || 'サブ見出し'}
          </Typography>
        </Box>
        
        {/* 記事本文 */}
        <Box sx={{ 
          mb: 3,
          columnCount: newspaper.style?.columnCount || 1,
          columnGap: '2rem',
          fontSize: newspaper.style?.bodyFontSize || '16px',
          writingMode: newspaper.style?.textDirection === 'vertical-rl' || newspaper.style?.textDirection === 'vertical-lr' 
            ? newspaper.style.textDirection 
            : 'horizontal-tb',
          height: newspaper.style?.textDirection === 'vertical-rl' || newspaper.style?.textDirection === 'vertical-lr'
            ? '600px'
            : 'auto',
          overflowX: newspaper.style?.textDirection === 'vertical-rl' || newspaper.style?.textDirection === 'vertical-lr'
            ? 'auto'
            : 'visible'
        }}
        >
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            {newspaper.content?.content?.lead || 'リード文がここに表示されます。'}
          </Typography>
          
          <Typography paragraph style={{ textIndent: '1em', lineHeight: 1.8 }}>
            {newspaper.content?.content?.body || '本文がここに表示されます。'}
          </Typography>
          
          <Typography paragraph>
            {newspaper.content?.content?.conclusion || '結論がここに表示されます。'}
          </Typography>
        </Box>
        
        {/* サイド情報 */}
        <Box sx={{ 
          p: 1, 
          border: newspaper.style?.borderColor ? `1px solid ${newspaper.style.borderColor}` : '1px solid #8b4513',
          backgroundColor: newspaper.style?.headlineBackgroundColor || '#f0f0d8',
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            キーワード
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {(newspaper.content?.sideInfo?.keywords || []).map((keyword: string, index: number) => (
              <Box 
                key={index}
                sx={{ 
                  border: '1px solid #000', 
                  borderRadius: '4px', 
                  px: 1, 
                  py: 0.5,
                  fontSize: '0.75rem',
                  display: 'inline-block'
                }}
              >
                {keyword}
              </Box>
            ))}
          </Box>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            今後の展望
          </Typography>
          
          <Typography variant="body2">
            {newspaper.content?.sideInfo?.futureImplications || '今後の展望がここに表示されます。'}
          </Typography>
        </Box>
        
        {/* フッター */}
        <Box sx={{ mt: 3, pt: 1, borderTop: newspaper.style?.borderColor ? `1px solid ${newspaper.style.borderColor}` : '1px solid #8b4513' }}>
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} {newspaper.metadata?.publisher || '研究新聞アプリ'}
          </Typography>
        </Box>
      </Box>
    </>
  );
}