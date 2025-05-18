'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-provider';
import { 
  Box, 
  Typography, 
  Breadcrumbs, 
  Link as MuiLink, 
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { 
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import EnhancedNewspaperEditor from '@/components/newspaper/EnhancedNewspaperEditor';
import { getDocumentById } from '@/lib/firebase/firestore';

export default function EditNewspaperPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const newspaperId = params.id;
  
  const [newspaperData, setNewspaperData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);
  
  // 新聞データの取得
  useEffect(() => {
    const fetchNewspaperData = async () => {
      try {
        const newspaper = await getDocumentById('newspapers', newspaperId);
        
        if (!newspaper) {
          setError('指定された新聞が見つかりません');
          return;
        }
        
        // 権限チェック（作成者のみ編集可能）
        if (newspaper.userId !== user?.uid) {
          setError('この新聞を編集する権限がありません');
          return;
        }
        
        setNewspaperData(newspaper);
      } catch (err: any) {
        console.error('Error fetching newspaper:', err);
        setError(`新聞データの取得に失敗しました: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading && user) {
      fetchNewspaperData();
    }
  }, [newspaperId, user, authLoading]);
  
  // エラーハンドラー
  const handleError = (error: any) => {
    console.error('Editor error:', error);
    setError('編集中にエラーが発生しました: ' + (error.message || '未知のエラー'));
  };
  
  // 保存成功ハンドラー
  const handleSaveSuccess = (newspaper: any) => {
    setUnsavedChanges(false);
    router.push(`/dashboard/newspapers/${newspaperId}`);
  };
  
  // 詳細ページに戻る
  const handleBackToDetail = () => {
    if (unsavedChanges) {
      setNavigationTarget(`/dashboard/newspapers/${newspaperId}`);
      setShowLeaveConfirmation(true);
    } else {
      router.push(`/dashboard/newspapers/${newspaperId}`);
    }
  };
  
  // 離脱確認ダイアログでの確認
  const handleConfirmNavigation = () => {
    setShowLeaveConfirmation(false);
    if (navigationTarget) {
      router.push(navigationTarget);
    }
  };
  
  // 離脱確認ダイアログでのキャンセル
  const handleCancelNavigation = () => {
    setShowLeaveConfirmation(false);
    setNavigationTarget(null);
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
    router.push(`/login?redirect=/dashboard/newspapers/${newspaperId}/edit`);
    return null;
  }

  // 新聞データ取得中はローディング表示
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {/* パンくずリスト */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <MuiLink 
          component={Link} 
          href="/dashboard"
          underline="hover" 
          color="inherit"
        >
          ダッシュボード
        </MuiLink>
        <MuiLink 
          component={Link} 
          href="/dashboard/newspapers"
          underline="hover" 
          color="inherit"
        >
          新聞管理
        </MuiLink>
        <MuiLink 
          component={Link} 
          href={`/dashboard/newspapers/${newspaperId}`}
          underline="hover" 
          color="inherit"
        >
          新聞詳細
        </MuiLink>
        <Typography color="text.primary">編集</Typography>
      </Breadcrumbs>
      
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          新聞を編集
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDetail}
        >
          詳細に戻る
        </Button>
      </Box>
      
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* エディタコンポーネント */}
      <EnhancedNewspaperEditor
        newspaperId={newspaperId}
        userId={user.uid}
        onSave={handleSaveSuccess}
        onError={handleError}
      />
      
      {/* 離脱確認ダイアログ */}
      <Dialog
        open={showLeaveConfirmation}
        onClose={handleCancelNavigation}
      >
        <DialogTitle>変更が保存されていません</DialogTitle>
        <DialogContent>
          <DialogContentText>
            変更内容が保存されていません。保存せずに移動しますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNavigation}>キャンセル</Button>
          <Button onClick={handleConfirmNavigation} color="error" autoFocus>
            保存せずに移動
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}