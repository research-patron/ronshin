'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  InputAdornment,
  LinearProgress,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, limit, startAfter, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebase';

// 状態を表示するユーティリティコンポーネント
const ProcessingStatusChip = ({ status }: { status: string }) => {
  let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
  let label = '不明';

  switch (status) {
    case 'pending':
      color = 'warning';
      label = '処理待ち';
      break;
    case 'processing':
      color = 'info';
      label = '処理中';
      break;
    case 'completed':
      color = 'success';
      label = '完了';
      break;
    case 'failed':
      color = 'error';
      label = '失敗';
      break;
    default:
      color = 'default';
      label = '不明';
  }

  return <Chip size="small" color={color} label={label} />;
};

export default function PapersPage() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState<any>(null);

  // 論文データを取得
  const fetchPapers = async (reset = false) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let papersQuery;

      if (reset) {
        // 最初のページを取得
        papersQuery = query(
          collection(db, 'papers'),
          where('uploaderId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(rowsPerPage)
        );
      } else if (lastVisible) {
        // 次のページを取得
        papersQuery = query(
          collection(db, 'papers'),
          where('uploaderId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(rowsPerPage)
        );
      } else {
        // 最初のページを取得
        papersQuery = query(
          collection(db, 'papers'),
          where('uploaderId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(rowsPerPage)
        );
      }

      const papersSnapshot = await getDocs(papersQuery);
      
      // Check if there are more papers
      setHasMore(papersSnapshot.docs.length === rowsPerPage);
      
      // Set the last visible document for pagination
      if (papersSnapshot.docs.length > 0) {
        setLastVisible(papersSnapshot.docs[papersSnapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }

      const papersData = papersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (reset) {
        setPapers(papersData);
      } else {
        setPapers(prev => [...prev, ...papersData]);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
      setError('論文データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 検索機能
  const handleSearch = async () => {
    if (!user) return;
    if (!searchTerm.trim()) {
      // 検索語が空の場合は全件取得に戻す
      setPage(0);
      fetchPapers(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Firestoreでタイトルで検索（単純な完全一致。実用的には.includes()や.indexOf()が必要かも）
      const papersQuery = query(
        collection(db, 'papers'),
        where('uploaderId', '==', user.uid),
        orderBy('title'),
        // Firestoreではパーシャルマッチ検索ができないため、実際にはFEで絞り込む必要がある
        limit(100) // より多くのデータを取得しクライアント側でフィルタリング
      );

      const papersSnapshot = await getDocs(papersQuery);

      // クライアント側でフィルタリング
      const papersData = papersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(paper => 
          paper.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      setPapers(papersData);
      setPage(0);
      setLastVisible(null);
      setHasMore(false);
    } catch (error) {
      console.error('Error searching papers:', error);
      setError('論文の検索中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 論文削除ダイアログを開く
  const openDeleteDialog = (paper: any) => {
    setPaperToDelete(paper);
    setDeleteDialogOpen(true);
  };

  // 論文削除処理
  const handleDeletePaper = async () => {
    if (!paperToDelete || !user) return;

    try {
      setLoading(true);
      
      // Firestoreのドキュメントを削除
      await deleteDoc(doc(db, 'papers', paperToDelete.id));
      
      // Storageのファイルを削除
      if (paperToDelete.fileUrl) {
        const fileRef = ref(storage, `papers/${user.uid}/${paperToDelete.id}.pdf`);
        await deleteObject(fileRef);
      }
      
      // UIから削除
      setPapers(papers.filter(paper => paper.id !== paperToDelete.id));
      
      // ダイアログを閉じる
      setDeleteDialogOpen(false);
      setPaperToDelete(null);
    } catch (error) {
      console.error('Error deleting paper:', error);
      setError('論文の削除中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // ページ変更時
  const handleChangePage = (event: unknown, newPage: number) => {
    if (newPage > page && hasMore) {
      fetchPapers();
    }
    setPage(newPage);
  };

  // 行数変更時
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setLastVisible(null);
    setPapers([]);
    fetchPapers(true);
  };

  // 初期データ取得
  useEffect(() => {
    fetchPapers(true);
  }, [user, rowsPerPage]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          論文管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/dashboard/papers/upload"
        >
          論文をアップロード
        </Button>
      </Box>
      
      {/* 検索バー */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="論文タイトルで検索..."
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
      
      {/* 論文リスト */}
      <Paper>
        {loading && <LinearProgress />}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>タイトル</TableCell>
                <TableCell>アップロード日</TableCell>
                <TableCell>処理状態</TableCell>
                <TableCell>アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {papers.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((paper) => (
                <TableRow key={paper.id}>
                  <TableCell>
                    <Link href={`/dashboard/papers/${paper.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {paper.title || '無題の論文'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {paper.createdAt?.toDate().toLocaleDateString() || '不明'}
                  </TableCell>
                  <TableCell>
                    <ProcessingStatusChip status={paper.processingStatus} />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      component={Link} 
                      href={`/dashboard/papers/${paper.id}`}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => openDeleteDialog(paper)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              
              {papers.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      論文がありません
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      component={Link}
                      href="/dashboard/papers/upload"
                      sx={{ mt: 1 }}
                    >
                      論文をアップロード
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={hasMore ? -1 : papers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}+`}`
          }
        />
      </Paper>
      
      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>論文を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{paperToDelete?.title || '無題の論文'}」を削除します。この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleDeletePaper} color="error" autoFocus>
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}