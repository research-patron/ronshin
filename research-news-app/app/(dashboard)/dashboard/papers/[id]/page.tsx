'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-provider';
import { 
  Box, 
  Typography, 
  Paper, 
  Breadcrumbs, 
  Link as MuiLink, 
  Button, 
  Grid, 
  Chip, 
  Divider, 
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import { 
  NavigateNext as NavigateNextIcon,
  LocalLibrary as LocalLibraryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreVertIcon,
  Science as ScienceIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebase';

// 状態を表示するユーティリティコンポーネント
const ProcessingStatusChip = ({ status }: { status: string }) => {
  let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
  let icon = null;
  let label = '不明';

  switch (status) {
    case 'pending':
      color = 'warning';
      icon = <PendingIcon />;
      label = '処理待ち';
      break;
    case 'processing':
      color = 'info';
      icon = <PendingIcon />;
      label = '処理中';
      break;
    case 'completed':
      color = 'success';
      icon = <CheckCircleIcon />;
      label = '完了';
      break;
    case 'failed':
      color = 'error';
      icon = <ErrorIcon />;
      label = '失敗';
      break;
    default:
      color = 'default';
      icon = <PendingIcon />;
      label = '不明';
  }

  return <Chip icon={icon} color={color} label={label} size="small" />;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`paper-tabpanel-${index}`}
      aria-labelledby={`paper-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `paper-tab-${index}`,
    'aria-controls': `paper-tabpanel-${index}`,
  };
}

export default function PaperDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const paperId = params.id;
  
  // 状態管理
  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // タブの状態
  const [tabValue, setTabValue] = useState(0);
  
  // 論文データを取得
  useEffect(() => {
    const fetchPaperData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 論文データを取得
        const paperDocRef = doc(db, 'papers', paperId);
        const paperDoc = await getDoc(paperDocRef);
        
        if (!paperDoc.exists()) {
          setError('指定された論文が見つかりません');
          setLoading(false);
          return;
        }
        
        const paperData = paperDoc.data();
        setPaper(paperData);
        
      } catch (error) {
        console.error('Error fetching paper:', error);
        setError('論文データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaperData();
  }, [user, paperId]);
  
  // メニューを開く
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // メニューを閉じる
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // 削除ダイアログを開く
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  // 論文を削除
  const handleDeletePaper = async () => {
    try {
      setLoading(true);
      
      // Firestoreから削除
      await deleteDoc(doc(db, 'papers', paperId));
      
      // Storageのファイルを削除
      if (paper.fileUrl) {
        try {
          const fileRef = ref(storage, `papers/${user.uid}/${paperId}.pdf`);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn('Storage file might not exist:', storageError);
        }
      }
      
      // 削除後はリストページにリダイレクト
      router.push('/dashboard/papers');
    } catch (error) {
      console.error('Error deleting paper:', error);
      setError('論文の削除中にエラーが発生しました');
      setLoading(false);
    }
  };
  
  // PDFダウンロード
  const handleDownloadPdf = () => {
    if (paper?.fileUrl) {
      window.open(paper.fileUrl, '_blank');
    }
    handleMenuClose();
  };
  
  // タブ変更
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // ローディング表示
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // エラー表示
  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          component={Link} 
          href="/dashboard/papers"
          sx={{ mt: 2 }}
        >
          論文一覧に戻る
        </Button>
      </Box>
    );
  }
  
  // 論文データがない場合
  if (!paper) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="warning">論文データが読み込めませんでした</Alert>
        <Button 
          variant="contained" 
          component={Link} 
          href="/dashboard/papers"
          sx={{ mt: 2 }}
        >
          論文一覧に戻る
        </Button>
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
          href="/dashboard/papers"
          underline="hover" 
          color="inherit"
        >
          論文管理
        </MuiLink>
        <Typography color="text.primary">論文詳細</Typography>
      </Breadcrumbs>
      
      {/* ヘッダー部分 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {paper.title || '無題の論文'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <ProcessingStatusChip status={paper.processingStatus} />
            <Typography variant="body2" color="text.secondary">
              アップロード日: {paper.createdAt?.toDate().toLocaleDateString() || '不明'}
            </Typography>
          </Box>
          
          {paper.authors && paper.authors.length > 0 && (
            <Typography variant="body1">
              著者: {paper.authors.join(', ')}
            </Typography>
          )}
          
          {paper.journal && (
            <Typography variant="body2" color="text.secondary">
              ジャーナル: {paper.journal}
            </Typography>
          )}
        </Box>
        
        <Box>
          <Button
            variant="contained"
            startIcon={<ScienceIcon />}
            component={Link}
            href={{
              pathname: '/dashboard/newspapers/create',
              query: { papers: paperId }
            }}
            sx={{ mr: 1 }}
          >
            この論文で新聞を作成
          </Button>
          
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* アラート表示 */}
      {paper.processingStatus === 'processing' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          この論文はAIによる解析処理中です。しばらくお待ちください。
        </Alert>
      )}
      
      {paper.processingStatus === 'failed' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          論文の解析に失敗しました。再度アップロードをお試しください。
        </Alert>
      )}
      
      {paper.processingStatus === 'pending' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          この論文は解析待ちです。処理が開始されるまでしばらくお待ちください。
        </Alert>
      )}
      
      {/* タブ */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="paper tabs"
          centered
        >
          <Tab label="AI解析結果" {...a11yProps(0)} disabled={paper.processingStatus !== 'completed'} />
          <Tab label="メタデータ" {...a11yProps(1)} />
          <Tab label="プレビュー" {...a11yProps(2)} />
        </Tabs>
        
        {/* AI解析結果タブ */}
        <TabPanel value={tabValue} index={0}>
          {paper.processingStatus === 'completed' ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  要約
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body1">
                    {paper.aiAnalysis?.summary || '要約情報がありません'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  重要ポイント
                </Typography>
                <Paper sx={{ p: 2 }}>
                  {paper.aiAnalysis?.keypoints && paper.aiAnalysis.keypoints.length > 0 ? (
                    <List dense>
                      {paper.aiAnalysis.keypoints.map((point: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <LocalLibraryIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={point} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body1">
                      重要ポイント情報がありません
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  研究の意義
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body1">
                    {paper.aiAnalysis?.significance || '研究の意義情報がありません'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  関連トピック
                </Typography>
                <Paper sx={{ p: 2 }}>
                  {paper.aiAnalysis?.relatedTopics && paper.aiAnalysis.relatedTopics.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {paper.aiAnalysis.relatedTopics.map((topic: string, index: number) => (
                        <Chip key={index} label={topic} />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1">
                      関連トピック情報がありません
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI解析データ
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        学術分野
                      </Typography>
                      <Typography variant="body1">
                        {paper.aiAnalysis?.academicField || '不明'}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        専門レベル
                      </Typography>
                      <Typography variant="body1">
                        {paper.aiAnalysis?.technicalLevel === 'beginner' && '初級'}
                        {paper.aiAnalysis?.technicalLevel === 'intermediate' && '中級'}
                        {paper.aiAnalysis?.technicalLevel === 'advanced' && '上級'}
                        {!paper.aiAnalysis?.technicalLevel && '不明'}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        AI信頼性スコア
                      </Typography>
                      <Typography variant="body1">
                        {paper.aiAnalysis?.aiConfidenceScore || 'N/A'}/100
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              この論文のAI解析はまだ完了していません。解析が完了すると結果が表示されます。
            </Alert>
          )}
        </TabPanel>
        
        {/* メタデータタブ */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    タイトル
                  </Typography>
                  <Typography variant="body1">
                    {paper.title || '無題'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    著者
                  </Typography>
                  <Typography variant="body1">
                    {paper.authors && paper.authors.length > 0 ? paper.authors.join(', ') : '著者情報なし'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    ジャーナル
                  </Typography>
                  <Typography variant="body1">
                    {paper.journal || 'ジャーナル情報なし'}
                  </Typography>
                </Box>
                
                {paper.doi && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      DOI
                    </Typography>
                    <Typography variant="body1">
                      {paper.doi}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                ファイル情報
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    ファイルサイズ
                  </Typography>
                  <Typography variant="body1">
                    {paper.fileSize ? `${(paper.fileSize / (1024 * 1024)).toFixed(2)} MB` : '不明'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    アップロード日時
                  </Typography>
                  <Typography variant="body1">
                    {paper.createdAt?.toDate().toLocaleString() || '不明'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    処理状態
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <ProcessingStatusChip status={paper.processingStatus} />
                  </Box>
                </Box>
                
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadPdf}
                  disabled={!paper.fileUrl}
                  sx={{ mt: 1 }}
                >
                  PDFをダウンロード
                </Button>
              </Paper>
            </Grid>
            
            {paper.errorLogs && paper.errorLogs.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  エラーログ
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <List dense>
                    {paper.errorLogs.map((log: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ErrorIcon color="error" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={log.message} 
                          secondary={log.timestamp?.toDate().toLocaleString() || '日時不明'} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* プレビュータブ */}
        <TabPanel value={tabValue} index={2}>
          {paper.fileUrl ? (
            <Box sx={{ height: '800px', border: '1px solid #ddd' }}>
              <iframe 
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(paper.fileUrl)}&embedded=true`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="PDF Viewer"
              />
            </Box>
          ) : (
            <Alert severity="info">
              PDFプレビューを表示できません。PDFファイルがアップロードされていないか、URLが無効です。
            </Alert>
          )}
        </TabPanel>
      </Paper>
      
      {/* アクションメニュー */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDownloadPdf} disabled={!paper.fileUrl}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          PDFをダウンロード
        </MenuItem>
        <MenuItem 
          component={Link}
          href={{
            pathname: '/dashboard/newspapers/create',
            query: { papers: paperId }
          }}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          この論文で新聞を作成
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteDialogOpen}>
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
        <DialogTitle>論文を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{paper.title || '無題の論文'}」を削除します。この操作は元に戻せません。
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