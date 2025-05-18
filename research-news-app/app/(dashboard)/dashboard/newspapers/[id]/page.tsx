'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-provider';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  Chip, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import NewspaperActions from '@/components/newspaper/NewspaperActions';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getTemplateById } from '@/lib/templates/newspaper-templates';

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

// タブパネル
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
      id={`newspaper-tabpanel-${index}`}
      aria-labelledby={`newspaper-tab-${index}`}
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
    id: `newspaper-tab-${index}`,
    'aria-controls': `newspaper-tabpanel-${index}`,
  };
}

// 新聞詳細ページ
export default function NewspaperDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const newspaperId = params.id;
  
  // 新聞コンテンツ参照
  const newspaperContentRef = useRef<HTMLDivElement>(null);
  
  // 状態管理
  const [newspaper, setNewspaper] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [relatedPapers, setRelatedPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // タブの状態
  const [tabValue, setTabValue] = useState(0);
  
  // 新聞データを取得
  useEffect(() => {
    const fetchNewspaperData = async () => {
      if (!user) return;
      
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
        
        // 関連論文を取得
        const paperIds = [
          ...(newspaperData.content?.mainArticle?.paperIds || []),
          ...(newspaperData.content?.subArticles?.map((sub: any) => sub.paperId) || [])
        ].filter(Boolean);
        
        const uniquePaperIds = [...new Set(paperIds)];
        
        if (uniquePaperIds.length > 0) {
          const paperPromises = uniquePaperIds.map(id => 
            getDoc(doc(db, 'papers', id))
          );
          
          const paperDocs = await Promise.all(paperPromises);
          const papersData = paperDocs
            .filter(doc => doc.exists())
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          
          setRelatedPapers(papersData);
        }
      } catch (error) {
        console.error('Error fetching newspaper:', error);
        setError('新聞データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNewspaperData();
  }, [user, newspaperId]);
  
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
  
  // 共有ダイアログを開く
  const handleShareDialogOpen = () => {
    setShareDialogOpen(true);
    handleMenuClose();
  };
  
  // 新聞を削除
  const handleDeleteNewspaper = async () => {
    try {
      setLoading(true);
      
      // Firestoreから削除
      await deleteDoc(doc(db, 'newspapers', newspaperId));
      
      // 削除後はリストページにリダイレクト
      router.push('/dashboard/newspapers');
    } catch (error) {
      console.error('Error deleting newspaper:', error);
      setError('新聞の削除中にエラーが発生しました');
      setLoading(false);
    }
  };
  
  // 共有対象のチェック
  const handleShareWithGroup = (groupId: string) => {
    // グループとの共有処理を実装
    console.log('Share with group:', groupId);
    // 実際の実装は今後開発予定
  };
  
  // 公開設定の変更
  const handleChangePublicStatus = (status: string) => {
    // 公開設定の変更処理を実装
    console.log('Change public status to:', status);
    // 実際の実装は今後開発予定
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
          href="/dashboard/newspapers"
          sx={{ mt: 2 }}
        >
          新聞一覧に戻る
        </Button>
      </Box>
    );
  }
  
  // 新聞データがない場合
  if (!newspaper) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="warning">新聞データが読み込めませんでした</Alert>
        <Button 
          variant="contained" 
          component={Link} 
          href="/dashboard/newspapers"
          sx={{ mt: 2 }}
        >
          新聞一覧に戻る
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* ヘッダー部分 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {newspaper.title || '無題の新聞'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              作成日: {newspaper.createdAt?.toDate().toLocaleDateString() || '不明'}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Typography variant="body2" color="text.secondary">
              テンプレート: {template?.name || '不明'}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <ShareStatusChip type={newspaper.shareSettings?.type || 'private'} />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            component={Link}
            href={`/dashboard/newspapers/${newspaperId}/edit`}
          >
            編集
          </Button>
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* タブ */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="newspaper tabs"
          centered
        >
          <Tab label="プレビュー" {...a11yProps(0)} />
          <Tab label="詳細情報" {...a11yProps(1)} />
          <Tab label="関連論文" {...a11yProps(2)} />
        </Tabs>
        
        {/* プレビュータブ */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            {/* 新聞プレビュー表示 */}
            <Box 
              ref={newspaperContentRef}
              sx={{ 
                width: '100%', 
                maxWidth: '1200px', 
                margin: '0 auto', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                backgroundColor: '#f9f9f9',
                position: 'relative'
              }}
            >
              {/* ヘッダー部分 */}
              <Box 
                sx={{ 
                  p: 2, 
                  borderBottom: '3px solid #000', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#fff'
                }}
              >
                <Typography variant="h5" component="div" sx={{ fontFamily: "'游明朝', YuMincho, serif", fontWeight: 'bold' }}>
                  {newspaper.content?.header?.newspaperName || '学術新聞'}
                </Typography>
                <Typography variant="body2">
                  {newspaper.content?.header?.date || ''}
                </Typography>
                <Typography variant="body2">
                  {newspaper.content?.header?.issueNumber || ''}
                </Typography>
              </Box>
              
              {/* メインコンテンツ部分 */}
              <Grid container sx={{ minHeight: '800px' }}>
                {/* メイン記事 */}
                <Grid item xs={12} md={8} sx={{ p: 2, borderRight: { md: '1px solid #ddd' } }}>
                  <Typography variant="h4" component="h2" sx={{ mb: 2, fontFamily: "'游明朝', YuMincho, serif", fontWeight: 'bold' }}>
                    {newspaper.content?.mainArticle?.headline || '見出し'}
                  </Typography>
                  
                  {newspaper.content?.mainArticle?.subheadline && (
                    <Typography variant="h6" component="h3" sx={{ mb: 2, fontFamily: "'游明朝', YuMincho, serif" }}>
                      {newspaper.content.mainArticle.subheadline}
                    </Typography>
                  )}
                  
                  {newspaper.content?.mainArticle?.imageUrl && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                      <img 
                        src={newspaper.content.mainArticle.imageUrl} 
                        alt="Main article illustration" 
                        style={{ maxWidth: '100%', maxHeight: '400px' }}
                      />
                    </Box>
                  )}
                  
                  <Box 
                    sx={{ 
                      writingMode: 'vertical-rl', 
                      height: '600px', 
                      overflowX: 'auto',
                      fontFamily: "'游明朝', YuMincho, serif",
                      fontSize: '16px',
                      lineHeight: 1.8,
                      textAlign: 'justify'
                    }}
                  >
                    {newspaper.content?.mainArticle?.content || '記事本文'}
                  </Box>
                </Grid>
                
                {/* サイドバー */}
                <Grid item xs={12} md={4} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  {/* サブ記事 */}
                  {newspaper.content?.subArticles?.map((subArticle: any, index: number) => (
                    <Box key={index} sx={{ mb: 3, pb: 2, borderBottom: index < (newspaper.content.subArticles.length - 1) ? '1px solid #ddd' : 'none' }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 1, fontFamily: "'游明朝', YuMincho, serif", fontWeight: 'bold' }}>
                        {subArticle.headline || `サブ記事 ${index + 1}`}
                      </Typography>
                      
                      {subArticle.imageUrl && (
                        <Box sx={{ mb: 1 }}>
                          <img 
                            src={subArticle.imageUrl} 
                            alt={`Sub article ${index + 1} illustration`} 
                            style={{ maxWidth: '100%', maxHeight: '200px' }}
                          />
                        </Box>
                      )}
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: "'游明朝', YuMincho, serif",
                          writingMode: 'vertical-rl',
                          height: '200px',
                          overflowX: 'auto'
                        }}
                      >
                        {subArticle.content || 'サブ記事本文'}
                      </Typography>
                    </Box>
                  ))}
                  
                  {/* サイドバーコンテンツ */}
                  <Box sx={{ p: 1, border: '1px solid #ddd', bgcolor: '#fff', borderRadius: '4px' }}>
                    <Typography variant="body2">
                      {newspaper.content?.sidebarContent || 'サイドバーコンテンツ'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* フッター部分 */}
              <Box sx={{ p: 2, borderTop: '2px solid #000', bgcolor: '#fff' }}>
                <Typography variant="body2">
                  {newspaper.content?.footer || ''}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <NewspaperActions
                newspaperId={newspaperId}
                newspaperTitle={newspaper.title || '無題の新聞'}
                contentRef={newspaperContentRef}
                onShare={type => {
                  if (type === 'link') {
                    handleShareDialogOpen();
                  }
                }}
              />
            </Box>
          </Box>
        </TabPanel>
        
        {/* 詳細情報タブ */}
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
                    {newspaper.title || '無題'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    作成日時
                  </Typography>
                  <Typography variant="body1">
                    {newspaper.createdAt?.toDate().toLocaleString() || '不明'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    最終更新日時
                  </Typography>
                  <Typography variant="body1">
                    {newspaper.updatedAt?.toDate().toLocaleString() || '不明'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    テンプレート
                  </Typography>
                  <Typography variant="body1">
                    {template?.name || '不明'} ({template?.category || '不明'})
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                共有設定
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    公開状態
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <ShareStatusChip type={newspaper.shareSettings?.type || 'private'} />
                  </Box>
                </Box>
                
                {newspaper.shareSettings?.type === 'group' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      共有グループ
                    </Typography>
                    <Typography variant="body1">
                      {newspaper.shareSettings.groupIds?.length || 0}グループと共有中
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    閲覧数
                  </Typography>
                  <Typography variant="body1">
                    {newspaper.shareSettings?.viewCount || 0}回
                  </Typography>
                </Box>
                
                {newspaper.shareSettings?.shareUrl && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      共有URL
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {newspaper.shareSettings.shareUrl}
                      </Typography>
                      <IconButton size="small" onClick={() => window.open(newspaper.shareSettings.shareUrl, '_blank')}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={handleShareDialogOpen}
                  sx={{ mt: 1 }}
                >
                  共有設定変更
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                カスタマイズ設定
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      フォント
                    </Typography>
                    <Typography variant="body1">
                      {newspaper.customSettings?.fontFamily || 'デフォルト'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      カラースキーム
                    </Typography>
                    <Typography variant="body1">
                      {newspaper.customSettings?.colorScheme || 'デフォルト'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      カスタムロゴ
                    </Typography>
                    <Typography variant="body1">
                      {newspaper.customSettings?.logoUrl ? 'あり' : 'なし'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* 関連論文タブ */}
        <TabPanel value={tabValue} index={2}>
          {relatedPapers.length > 0 ? (
            <Grid container spacing={3}>
              {relatedPapers.map((paper) => (
                <Grid item xs={12} md={6} key={paper.id}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {paper.title || '無題の論文'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      著者: {paper.authors?.join(', ') || '不明'}
                    </Typography>
                    
                    {paper.journal && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        ジャーナル: {paper.journal}
                      </Typography>
                    )}
                    
                    {paper.aiAnalysis?.summary && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          要約:
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {paper.aiAnalysis.summary}
                        </Typography>
                      </Box>
                    )}
                    
                    <Button
                      variant="outlined"
                      size="small"
                      component={Link}
                      href={`/dashboard/papers/${paper.id}`}
                      sx={{ mt: 1 }}
                    >
                      詳細を表示
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              関連論文情報がありません
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
        <MenuItem 
          component={Link} 
          href={`/dashboard/newspapers/${newspaperId}/edit`}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          編集
        </MenuItem>
        <MenuItem onClick={handleShareDialogOpen}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          共有設定
        </MenuItem>
        <MenuItem onClick={() => window.open(`/api/newspapers/${newspaperId}/export-pdf`, '_blank')}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          PDFダウンロード
        </MenuItem>
        <MenuItem onClick={() => window.print()}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          印刷
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
        <DialogTitle>新聞を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{newspaper.title || '無題の新聞'}」を削除します。この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleDeleteNewspaper} color="error" autoFocus>
            削除
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 共有設定ダイアログ */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>共有設定</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            「{newspaper.title || '無題の新聞'}」の共有設定を変更します。
          </Typography>
          
          {/* 実際の共有設定UIはこの後実装 */}
          <Alert severity="info">
            共有設定機能は現在開発中です。次回のアップデートで実装予定です。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}