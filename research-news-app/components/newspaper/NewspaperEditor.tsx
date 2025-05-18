'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Divider,
  IconButton,
  Tooltip,
  FormHelperText,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Save as SaveIcon,
  Preview as PreviewIcon,
  VerticalAlignTop as VerticalAlignTopIcon,
  FormatAlignLeft as FormatAlignLeftIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { 
  Newspaper, 
  NewspaperContent, 
  NewspaperCustomSettings,
  availableFonts,
  availableColorSchemes,
  htmlToPlainText,
  escapeHTML,
  generateNewspaperHTML
} from '@/lib/utils/newspaper-utils';

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
      id={`editor-tabpanel-${index}`}
      aria-labelledby={`editor-tab-${index}`}
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
    id: `editor-tab-${index}`,
    'aria-controls': `editor-tabpanel-${index}`,
  };
}

interface NewspaperEditorProps {
  newspaperId: string;
  userId: string;
  onSave?: (newspaper: Newspaper) => void;
  onError?: (error: any) => void;
}

export default function NewspaperEditor({ newspaperId, userId, onSave, onError }: NewspaperEditorProps) {
  const [tabValue, setTabValue] = useState(0);
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);
  const [originalNewspaper, setOriginalNewspaper] = useState<Newspaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // カスタム設定
  const [selectedFont, setSelectedFont] = useState('default');
  const [selectedColorScheme, setSelectedColorScheme] = useState('default');
  
  // プレビュー
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // 変更があるかどうか
  const [hasChanges, setHasChanges] = useState(false);
  
  // 新聞データの取得
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
        
        // ユーザーの所有確認
        if (newspaperData.creatorId !== userId) {
          setError('このコンテンツを編集する権限がありません');
          setLoading(false);
          return;
        }
        
        setNewspaper(newspaperData);
        setOriginalNewspaper(JSON.parse(JSON.stringify(newspaperData))); // ディープコピー
        
        // カスタム設定を初期化
        setSelectedFont(newspaperData.customSettings?.fontFamily || 'default');
        setSelectedColorScheme(newspaperData.customSettings?.colorScheme || 'default');
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching newspaper:', error);
        setError('新聞データの取得中にエラーが発生しました');
        if (onError) onError(error);
        setLoading(false);
      }
    };
    
    fetchNewspaperData();
  }, [newspaperId, userId, onError]);
  
  // プレビュー更新
  useEffect(() => {
    if (showPreview && newspaper && previewRef.current) {
      try {
        const htmlContent = generateNewspaperHTML(newspaper, newspaper.customSettings);
        const doc = previewRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(htmlContent);
          doc.close();
        }
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  }, [showPreview, newspaper]);
  
  // 変更検知
  useEffect(() => {
    if (originalNewspaper && newspaper) {
      try {
        // ディープ比較ではなく、必要なフィールドのみ比較
        const isChanged = 
          newspaper.title !== originalNewspaper.title ||
          JSON.stringify(newspaper.content) !== JSON.stringify(originalNewspaper.content) ||
          JSON.stringify(newspaper.customSettings) !== JSON.stringify(originalNewspaper.customSettings);
        
        setHasChanges(isChanged);
      } catch (error) {
        console.error('Error checking changes:', error);
      }
    }
  }, [newspaper, originalNewspaper]);
  
  // タブ変更ハンドラー
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // プレビュータブの場合はプレビューを表示
    if (newValue === 3) {
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  };
  
  // 新聞タイトル変更ハンドラー
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!newspaper) return;
    
    setNewspaper({
      ...newspaper,
      title: event.target.value
    });
  };
  
  // ヘッダー情報の変更ハンドラー
  const handleHeaderChange = (field: keyof typeof newspaper.content.header) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!newspaper) return;
    
    setNewspaper({
      ...newspaper,
      content: {
        ...newspaper.content,
        header: {
          ...newspaper.content.header,
          [field]: event.target.value
        }
      }
    });
  };
  
  // メイン記事の変更ハンドラー
  const handleMainArticleChange = (field: keyof typeof newspaper.content.mainArticle) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!newspaper) return;
    
    setNewspaper({
      ...newspaper,
      content: {
        ...newspaper.content,
        mainArticle: {
          ...newspaper.content.mainArticle,
          [field]: event.target.value
        }
      }
    });
  };
  
  // サブ記事の変更ハンドラー
  const handleSubArticleChange = (index: number, field: keyof (typeof newspaper.content.subArticles)[0]) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!newspaper) return;
    
    const updatedSubArticles = [...newspaper.content.subArticles];
    updatedSubArticles[index] = {
      ...updatedSubArticles[index],
      [field]: event.target.value
    };
    
    setNewspaper({
      ...newspaper,
      content: {
        ...newspaper.content,
        subArticles: updatedSubArticles
      }
    });
  };
  
  // サブ記事の追加
  const handleAddSubArticle = () => {
    if (!newspaper) return;
    
    const newSubArticle = {
      headline: 'サブ記事見出し',
      content: 'サブ記事の本文をここに入力してください。',
      paperId: ''
    };
    
    setNewspaper({
      ...newspaper,
      content: {
        ...newspaper.content,
        subArticles: [...newspaper.content.subArticles, newSubArticle]
      }
    });
  };
  
  // サブ記事の削除
  const handleRemoveSubArticle = (index: number) => {
    if (!newspaper) return;
    
    const updatedSubArticles = [...newspaper.content.subArticles];
    updatedSubArticles.splice(index, 1);
    
    setNewspaper({
      ...newspaper,
      content: {
        ...newspaper.content,
        subArticles: updatedSubArticles
      }
    });
  };
  
  // サイドバーコンテンツの変更ハンドラー
  const handleSidebarContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!newspaper) return;
    
    setNewspaper({
      ...newspaper,
      content: {
        ...newspaper.content,
        sidebarContent: event.target.value
      }
    });
  };
  
  // フッターの変更ハンドラー
  const handleFooterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!newspaper) return;
    
    setNewspaper({
      ...newspaper,
      content: {
        ...newspaper.content,
        footer: event.target.value
      }
    });
  };
  
  // フォント変更ハンドラー
  const handleFontChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if (!newspaper) return;
    
    const font = event.target.value as string;
    setSelectedFont(font);
    
    setNewspaper({
      ...newspaper,
      customSettings: {
        ...newspaper.customSettings,
        fontFamily: font
      }
    });
  };
  
  // カラースキーム変更ハンドラー
  const handleColorSchemeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if (!newspaper) return;
    
    const scheme = event.target.value as string;
    setSelectedColorScheme(scheme);
    
    setNewspaper({
      ...newspaper,
      customSettings: {
        ...newspaper.customSettings,
        colorScheme: scheme
      }
    });
  };
  
  // 変更を保存
  const handleSave = async () => {
    if (!newspaper) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Firestoreに保存
      const newspaperDocRef = doc(db, 'newspapers', newspaperId);
      await updateDoc(newspaperDocRef, {
        title: newspaper.title,
        content: newspaper.content,
        customSettings: newspaper.customSettings,
        updatedAt: serverTimestamp()
      });
      
      // 成功メッセージ
      setSuccess('変更を保存しました');
      
      // オリジナルを更新
      setOriginalNewspaper(JSON.parse(JSON.stringify(newspaper)));
      
      // コールバック
      if (onSave) onSave(newspaper);
      
      setSaving(false);
    } catch (error) {
      console.error('Error saving newspaper:', error);
      setError('変更の保存中にエラーが発生しました');
      if (onError) onError(error);
      setSaving(false);
    }
  };
  
  // ローディング表示
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // エラー表示
  if (error && !newspaper) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  // 新聞データがない場合
  if (!newspaper) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        新聞データが読み込めませんでした
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* 上部バー */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs>
            <TextField
              label="新聞タイトル"
              value={newspaper.title}
              onChange={handleTitleChange}
              fullWidth
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => {
                setTabValue(3);
                setShowPreview(true);
              }}
            >
              プレビュー
            </Button>
          </Grid>
        </Grid>
        
        {/* メッセージ表示 */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
        
        {!error && !success && hasChanges && (
          <Alert severity="info" sx={{ mt: 2 }}>
            変更があります。保存ボタンを押して変更を保存してください。
          </Alert>
        )}
      </Paper>
      
      {/* タブ */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="newspaper editor tabs"
          centered
        >
          <Tab label="基本情報" {...a11yProps(0)} />
          <Tab label="メイン記事" {...a11yProps(1)} />
          <Tab label="サブ記事とサイドバー" {...a11yProps(2)} />
          <Tab label="プレビュー" {...a11yProps(3)} />
        </Tabs>
        
        {/* 基本情報タブ */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                ヘッダー情報
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="新聞名"
                    value={newspaper.content.header.newspaperName}
                    onChange={handleHeaderChange('newspaperName')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="日付"
                    value={newspaper.content.header.date}
                    onChange={handleHeaderChange('date')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="号数"
                    value={newspaper.content.header.issueNumber}
                    onChange={handleHeaderChange('issueNumber')}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                フッター情報
              </Typography>
              <TextField
                label="フッター"
                value={newspaper.content.footer}
                onChange={handleFooterChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                デザインのカスタマイズ
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="font-select-label">フォント</InputLabel>
                    <Select
                      labelId="font-select-label"
                      id="font-select"
                      value={selectedFont}
                      label="フォント"
                      onChange={handleFontChange}
                    >
                      {availableFonts.map((font) => (
                        <MenuItem 
                          key={font.id} 
                          value={font.id}
                          disabled={font.id === 'custom' && newspaper.customSettings?.fontFamily !== 'custom'}
                        >
                          {font.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {availableFonts.find(f => f.id === selectedFont)?.description || ''}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="color-scheme-select-label">カラースキーム</InputLabel>
                    <Select
                      labelId="color-scheme-select-label"
                      id="color-scheme-select"
                      value={selectedColorScheme}
                      label="カラースキーム"
                      onChange={handleColorSchemeChange}
                    >
                      {availableColorSchemes.map((scheme) => (
                        <MenuItem 
                          key={scheme.id} 
                          value={scheme.id}
                          disabled={scheme.id === 'custom' && newspaper.customSettings?.colorScheme !== 'custom'}
                        >
                          {scheme.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {availableColorSchemes.find(s => s.id === selectedColorScheme)?.description || ''}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* メイン記事タブ */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                見出し
              </Typography>
              <TextField
                label="メイン見出し"
                value={newspaper.content.mainArticle.headline}
                onChange={handleMainArticleChange('headline')}
                fullWidth
                helperText="20文字程度の新聞見出しを入力してください"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="サブ見出し"
                value={newspaper.content.mainArticle.subheadline || ''}
                onChange={handleMainArticleChange('subheadline')}
                fullWidth
                helperText="見出しを補足する短い文を入力してください（任意）"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                本文
              </Typography>
              <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="縦書き表示">
                  <IconButton>
                    <VerticalAlignTopIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="横書き表示">
                  <IconButton>
                    <FormatAlignLeftIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" color="text.secondary">
                  エディタでは横書きで編集しますが、新聞では縦書きで表示されます。
                </Typography>
              </Box>
              <TextField
                multiline
                rows={12}
                value={newspaper.content.mainArticle.content}
                onChange={handleMainArticleChange('content')}
                fullWidth
                placeholder="メイン記事の本文を入力してください..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                画像
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="画像URL"
                  value={newspaper.content.mainArticle.imageUrl || ''}
                  onChange={handleMainArticleChange('imageUrl')}
                  fullWidth
                  helperText="画像のURLを入力してください（任意）"
                />
                <IconButton>
                  <ImageIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* サブ記事とサイドバータブ */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  サブ記事
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddSubArticle}
                >
                  サブ記事を追加
                </Button>
              </Box>
              
              {newspaper.content.subArticles.map((subArticle, index) => (
                <Paper key={index} sx={{ p: 2, mb: 3, position: 'relative' }}>
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => handleRemoveSubArticle(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                  
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    サブ記事 {index + 1}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="見出し"
                        value={subArticle.headline}
                        onChange={handleSubArticleChange(index, 'headline')}
                        fullWidth
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        multiline
                        rows={4}
                        label="本文"
                        value={subArticle.content}
                        onChange={handleSubArticleChange(index, 'content')}
                        fullWidth
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          label="画像URL"
                          value={subArticle.imageUrl || ''}
                          onChange={handleSubArticleChange(index, 'imageUrl')}
                          fullWidth
                          helperText="画像のURLを入力してください（任意）"
                        />
                        <IconButton>
                          <ImageIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                サイドバーコンテンツ
              </Typography>
              <TextField
                multiline
                rows={6}
                value={newspaper.content.sidebarContent || ''}
                onChange={handleSidebarContentChange}
                fullWidth
                placeholder="サイドバーに表示する内容を入力してください..."
                helperText="サイドバーには関連キーワード、研究分野の解説、今後の展望などを記載できます"
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* プレビュータブ */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ height: '800px', border: '1px solid #ddd', overflow: 'auto' }}>
            <iframe 
              ref={previewRef}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="新聞プレビュー"
            />
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}