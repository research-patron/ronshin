'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Paper, 
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Alert,
  Pagination
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, limit, startAfter, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebase';

// 共有状態を表示するユーティリティコンポーネント
const ShareStatusChip = ({ type }: { type: string }) => {
  let icon = null;
  let label = '';
  let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';

  switch (type) {
    case 'private':
      icon = <LockIcon fontSize="small" />;
      label = '非公開';
      color = 'default';
      break;
    case 'group':
      icon = <ShareIcon fontSize="small" />;
      label = 'グループ共有';
      color = 'info';
      break;
    case 'public':
      icon = <PublicIcon fontSize="small" />;
      label = '公開';
      color = 'success';
      break;
    default:
      icon = <LockIcon fontSize="small" />;
      label = '非公開';
      color = 'default';
  }

  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      color={color}
    />
  );
};

export default function NewspapersPage() {
  const { user } = useAuth();
  const [newspapers, setNewspapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newspaperToDelete, setNewspaperToDelete] = useState<any>(null);
  
  // メニュー関連の状態
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [currentNewspaper, setCurrentNewspaper] = useState<any>(null);
  
  // 新聞データを取得
  const fetchNewspapers = async (reset = false, pageNum = 1) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let newspapersQuery;
      const skip = (pageNum - 1) * rowsPerPage;

      if (reset || pageNum === 1) {
        // 最初のページを取得
        newspapersQuery = query(
          collection(db, 'newspapers'),
          where('creatorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(rowsPerPage)
        );
      } else if (lastVisible) {
        // 次のページを取得
        newspapersQuery = query(
          collection(db, 'newspapers'),
          where('creatorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(rowsPerPage)
        );
      } else {
        // 最初から取得（通常はこのケースはないはず）
        newspapersQuery = query(
          collection(db, 'newspapers'),
          where('creatorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(rowsPerPage)
        );
      }

      const newspapersSnapshot = await getDocs(newspapersQuery);
      
      // 最後のドキュメントを保存
      if (newspapersSnapshot.docs.length > 0) {
        setLastVisible(newspapersSnapshot.docs[newspapersSnapshot.docs.length - 1]);
        setHasMore(newspapersSnapshot.docs.length === rowsPerPage);
      } else {
        setLastVisible(null);
        setHasMore(false);
      }

      const newspapersData = newspapersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (reset || pageNum === 1) {
        setNewspapers(newspapersData);
      } else {
        setNewspapers(prev => [...prev, ...newspapersData]);
      }

      // 総ページ数の計算（概算）
      // このロジックは不完全です。実際には総数を正確に取得する別のクエリが必要かもしれません
      if (pageNum === 1 && newspapersSnapshot.docs.length < rowsPerPage) {
        setTotalPages(1);
      } else if (pageNum === 1) {
        // とりあえず次のページはあるとする
        setTotalPages(2);
      } else if (!hasMore) {
        setTotalPages(pageNum);
      } else {
        setTotalPages(pageNum + 1);
      }
    } catch (error) {
      console.error('Error fetching newspapers:', error);
      setError('新聞データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };
  
  // 検索機能
  const handleSearch = async () => {
    if (!user) return;
    if (!searchTerm.trim()) {
      // 検索語が空の場合は全件取得に戻す
      setPage(1);
      fetchNewspapers(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Firestoreでタイトルで検索
      const newspapersQuery = query(
        collection(db, 'newspapers'),
        where('creatorId', '==', user.uid),
        orderBy('title'),
        // 実際には部分一致検索はこれだけでは難しいので、多めに取ってきてクライアントでフィルタリング
        limit(100)
      );

      const newspapersSnapshot = await getDocs(newspapersQuery);

      // クライアント側でフィルタリング
      const newspapersData = newspapersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(newspaper => 
          newspaper.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      setNewspapers(newspapersData);
      setPage(1);
      setTotalPages(Math.ceil(newspapersData.length / rowsPerPage));
      setLastVisible(null);
      setHasMore(false);
    } catch (error) {
      console.error('Error searching newspapers:', error);
      setError('新聞の検索中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };
  
  // メニューを開く
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, newspaper: any) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentNewspaper(newspaper);
  };
  
  // メニューを閉じる
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // 削除ダイアログを開く
  const openDeleteDialog = (newspaper: any) => {
    setNewspaperToDelete(newspaper);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  // 新聞削除処理
  const handleDeleteNewspaper = async () => {
    if (!newspaperToDelete || !user) return;

    try {
      setLoading(true);
      
      // Firestoreのドキュメントを削除
      await deleteDoc(doc(db, 'newspapers', newspaperToDelete.id));
      
      // Storageの関連ファイルを削除（プレビュー画像など）
      try {
        const previewRef = ref(storage, `newspapers/${newspaperToDelete.id}/preview.png`);
        await deleteObject(previewRef);
        
        const exportPdfRef = ref(storage, `newspapers/${newspaperToDelete.id}/export.pdf`);
        await deleteObject(exportPdfRef);
      } catch (storageError) {
        console.log('Some storage files might not exist', storageError);
        // ファイルが存在しない場合はエラーを無視
      }
      
      // UIから削除
      setNewspapers(newspapers.filter(newspaper => newspaper.id !== newspaperToDelete.id));
      
      // ダイアログを閉じる
      setDeleteDialogOpen(false);
      setNewspaperToDelete(null);
    } catch (error) {
      console.error('Error deleting newspaper:', error);
      setError('新聞の削除中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };
  
  // ページ変更時
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    
    // 現在のデータにページがなければ新たに取得
    if (value > Math.ceil(newspapers.length / rowsPerPage) && hasMore) {
      fetchNewspapers(false, value);
    }
  };
  
  // PDFダウンロード処理
  const handleDownloadPdf = async (newspaper: any) => {
    try {
      // PDFのURLを取得または生成
      const response = await fetch(`/api/newspapers/${newspaper.id}/export-pdf`);
      
      if (!response.ok) {
        throw new Error('PDF生成に失敗しました');
      }
      
      const data = await response.json();
      
      // PDFをダウンロード
      window.open(data.pdfUrl, '_blank');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('PDFのダウンロードに失敗しました');
    }
    
    handleMenuClose();
  };
  
  // 印刷処理
  const handlePrint = (newspaper: any) => {
    window.open(`/print/newspaper/${newspaper.id}`, '_blank');
    handleMenuClose();
  };
  
  // 初期データ取得
  useEffect(() => {
    fetchNewspapers(true);
  }, [user]);
  
  // 新聞カードの表示開始インデックス計算
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayedNewspapers = newspapers.slice(startIndex, endIndex);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          新聞管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/dashboard/newspapers/create"
        >
          新聞を作成
        </Button>
      </Box>
      
      {/* 検索バー */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="新聞タイトルで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button onClick={handleSearch}>検索</Button>
              </InputAdornment>
            ),
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
      </Paper>
      
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* ローディングインジケーター */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}
      
      {/* 新聞リスト */}
      {newspapers.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {displayedNewspapers.map((newspaper) => (
              <Grid item xs={12} sm={6} md={4} key={newspaper.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* プレビュー画像 */}
                  <Box sx={{ position: 'relative', pt: '56.25%', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      image={newspaper.previewUrl || '/newspaper-placeholder.png'}
                      alt={newspaper.title}
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {/* 共有状態表示 */}
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <ShareStatusChip type={newspaper.shareSettings?.type || 'private'} />
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      {newspaper.title || '無題の新聞'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      作成日: {newspaper.createdAt?.toDate().toLocaleDateString() || '不明'}
                    </Typography>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Button 
                      size="small" 
                      component={Link}
                      href={`/dashboard/newspapers/${newspaper.id}`}
                      startIcon={<VisibilityIcon />}
                    >
                      表示
                    </Button>
                    <IconButton onClick={(e) => handleMenuOpen(e, newspaper)}>
                      <MoreVertIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* ページネーション */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      ) : (
        // 新聞がない場合
        !loading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              新聞がありません
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              論文をアップロードして新聞を作成しましょう。
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              href="/dashboard/newspapers/create"
            >
              新聞を作成
            </Button>
          </Paper>
        )
      )}
      
      {/* アクションメニュー */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          component={Link} 
          href={`/dashboard/newspapers/${currentNewspaper?.id}`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          表示
        </MenuItem>
        <MenuItem 
          component={Link} 
          href={`/dashboard/newspapers/${currentNewspaper?.id}/edit`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          編集
        </MenuItem>
        <MenuItem 
          component={Link} 
          href={`/dashboard/newspapers/${currentNewspaper?.id}/share`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          共有設定
        </MenuItem>
        <MenuItem onClick={() => currentNewspaper && handleDownloadPdf(currentNewspaper)}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          PDFダウンロード
        </MenuItem>
        <MenuItem onClick={() => currentNewspaper && handlePrint(currentNewspaper)}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          印刷
        </MenuItem>
        <MenuItem onClick={() => currentNewspaper && openDeleteDialog(currentNewspaper)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">削除</Typography>
        </MenuItem>
      </Menu>
      
      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>新聞を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{newspaperToDelete?.title || '無題の新聞'}」を削除します。この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleDeleteNewspaper} color="error" autoFocus>
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}