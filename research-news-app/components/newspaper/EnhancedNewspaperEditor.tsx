'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Grid, 
  Divider, 
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Tab,
  Tabs,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Preview as PreviewIcon,
  AutoAwesome as AutoAwesomeIcon,
  ColorLens as ColorLensIcon,
  FormatSize as FormatSizeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNewspaperEditor } from '@/hooks/useNewspaperEditor';
import { applyVerticalWritingStyles, getTextDirectionClass } from '@/utils/vertical-text';

interface NewspaperEditorProps {
  newspaperId?: string; // 新規作成の場合は未指定
  paperId?: string; // 論文IDから新聞を作成する場合
  templateId?: string; // テンプレートID
  userId: string;
  onSave?: (newspaper: any) => void;
  onError?: (error: any) => void;
}

// フォントファミリーの選択肢
const fontOptions = [
  { value: '"Noto Serif JP", serif', label: '明朝体（Noto Serif JP）' },
  { value: '"Noto Sans JP", sans-serif', label: 'ゴシック体（Noto Sans JP）' },
  { value: '"Shippori Mincho", serif', label: '和風明朝体（Shippori Mincho）' },
  { value: '"M PLUS 1p", sans-serif', label: '現代ゴシック（M PLUS 1p）' },
  { value: '"YuMincho", "Yu Mincho", serif', label: '游明朝（YuMincho）' },
];

// カラーテーマの選択肢
const colorSchemes = [
  { 
    value: 'classic', 
    label: 'クラシック', 
    colors: { 
      background: '#f5f5dc', 
      text: '#000000',
      headlineBackground: '#f0f0d8',
      border: '#8b4513'
    } 
  },
  { 
    value: 'modern', 
    label: 'モダン', 
    colors: { 
      background: '#ffffff', 
      text: '#333333',
      headlineBackground: '#f9f9f9',
      border: '#aaaaaa'
    } 
  },
  { 
    value: 'vintage', 
    label: 'ビンテージ', 
    colors: { 
      background: '#ecdfc8', 
      text: '#3a3a3a',
      headlineBackground: '#e5d8c0',
      border: '#6b532e'
    } 
  },
];

const EnhancedNewspaperEditor: React.FC<NewspaperEditorProps> = ({
  newspaperId,
  paperId,
  templateId,
  userId,
  onSave,
  onError
}) => {
  // 新聞エディタのカスタムフック使用
  const {
    newspaper,
    setNewspaper,
    loading,
    saving,
    error,
    success,
    generateHeadline,
    saveNewspaper,
    isGeneratingHeadline
  } = useNewspaperEditor(newspaperId, paperId, templateId, userId);

  // UI状態管理
  const [tabValue, setTabValue] = useState(0);
  const [isVerticalPreview, setIsVerticalPreview] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');
  const [newKeyword, setNewKeyword] = useState('');

  // エラー、成功メッセージの表示
  useEffect(() => {
    if (error) {
      setSnackbarMessage(`エラー: ${error}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      if (onError) onError(error);
    }
    
    if (success) {
      setSnackbarMessage('保存しました');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      if (onSave && newspaper) onSave(newspaper);
    }
  }, [error, success, newspaper, onError, onSave]);

  // 見出し生成
  const handleGenerateHeadline = async () => {
    try {
      await generateHeadline();
      setSnackbarMessage('見出しを生成しました');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    } catch (err) {
      setSnackbarMessage(`見出し生成エラー: ${err}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  // 新聞データ更新ハンドラ
  const handleChange = (section: string, field: string, value: string) => {
    setNewspaper((prev: any) => {
      if (!prev) return prev;
      
      if (section === 'style') {
        return {
          ...prev,
          style: {
            ...prev.style,
            [field]: value
          }
        };
      }
      
      if (section === 'metadata') {
        return {
          ...prev,
          metadata: {
            ...prev.metadata,
            [field]: value
          }
        };
      }
      
      // content内のフィールド
      return {
        ...prev,
        content: {
          ...prev.content,
          [section]: {
            ...prev.content[section],
            [field]: value
          }
        }
      };
    });
  };

  // カラースキーマ適用
  const applyColorScheme = (schemeValue: string) => {
    const scheme = colorSchemes.find(s => s.value === schemeValue);
    if (!scheme) return;
    
    setNewspaper((prev: any) => {
      if (!prev) return prev;
      
      return {
        ...prev,
        style: {
          ...prev.style,
          colorScheme: schemeValue,
          backgroundColor: scheme.colors.background,
          textColor: scheme.colors.text,
          headlineBackgroundColor: scheme.colors.headlineBackground,
          borderColor: scheme.colors.border
        }
      };
    });
  };

  // キーワード追加
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    setNewspaper((prev: any) => {
      if (!prev) return prev;
      
      const currentKeywords = prev.content.sideInfo.keywords || [];
      
      return {
        ...prev,
        content: {
          ...prev.content,
          sideInfo: {
            ...prev.content.sideInfo,
            keywords: [...currentKeywords, newKeyword.trim()]
          }
        }
      };
    });
    
    setNewKeyword('');
  };

  // キーワード削除
  const handleDeleteKeyword = (keyword: string) => {
    setNewspaper((prev: any) => {
      if (!prev) return prev;
      
      const currentKeywords = prev.content.sideInfo.keywords || [];
      
      return {
        ...prev,
        content: {
          ...prev.content,
          sideInfo: {
            ...prev.content.sideInfo,
            keywords: currentKeywords.filter((k: string) => k !== keyword)
          }
        }
      };
    });
  };

  // タブ切替
  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 保存処理
  const handleSave = async () => {
    await saveNewspaper();
  };

  // ローディング表示
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 新聞データがない場合
  if (!newspaper) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">新聞データを読み込めませんでした</Typography>
      </Box>
    );
  }

  // プレビュー表示用のスタイル
  const previewStyles = isVerticalPreview 
    ? applyVerticalWritingStyles(newspaper.style) 
    : {};

  return (
    <Box sx={{ mb: 4 }}>
      {/* タブメニュー */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleChangeTab} aria-label="新聞編集タブ">
          <Tab label="コンテンツ" />
          <Tab label="デザイン" />
          <Tab label="メタデータ" />
          <Tab label="プレビュー" />
        </Tabs>
      </Paper>

      {/* コンテンツ編集タブ */}
      {tabValue === 0 && (
        <Grid container spacing={2}>
          {/* 見出し編集 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">見出し</Typography>
                <Button 
                  startIcon={<AutoAwesomeIcon />}
                  variant="outlined"
                  onClick={handleGenerateHeadline}
                  disabled={isGeneratingHeadline}
                >
                  {isGeneratingHeadline ? 'AI生成中...' : 'AI見出し生成'}
                </Button>
              </Box>
              
              <TextField
                label="メイン見出し"
                fullWidth
                margin="normal"
                value={newspaper.content.headline.main || ''}
                onChange={(e) => handleChange('headline', 'main', e.target.value)}
                inputProps={{ maxLength: 25 }}
                helperText={`${(newspaper.content.headline.main || '').length}/25文字`}
              />
              
              <TextField
                label="サブ見出し"
                fullWidth
                margin="normal"
                value={newspaper.content.headline.sub || ''}
                onChange={(e) => handleChange('headline', 'sub', e.target.value)}
                inputProps={{ maxLength: 40 }}
                helperText={`${(newspaper.content.headline.sub || '').length}/40文字`}
              />
            </Paper>
          </Grid>
          
          {/* 本文編集 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>記事本文</Typography>
              
              <TextField
                label="リード文"
                fullWidth
                margin="normal"
                multiline
                rows={2}
                value={newspaper.content.content.lead || ''}
                onChange={(e) => handleChange('content', 'lead', e.target.value)}
                inputProps={{ maxLength: 150 }}
                helperText={`${(newspaper.content.content.lead || '').length}/150文字`}
              />
              
              <TextField
                label="本文"
                fullWidth
                margin="normal"
                multiline
                rows={10}
                value={newspaper.content.content.body || ''}
                onChange={(e) => handleChange('content', 'body', e.target.value)}
                helperText={`${(newspaper.content.content.body || '').length}/1000文字`}
              />
              
              <TextField
                label="結論"
                fullWidth
                margin="normal"
                multiline
                rows={2}
                value={newspaper.content.content.conclusion || ''}
                onChange={(e) => handleChange('content', 'conclusion', e.target.value)}
                inputProps={{ maxLength: 150 }}
                helperText={`${(newspaper.content.content.conclusion || '').length}/150文字`}
              />
            </Paper>
          </Grid>
          
          {/* サイド情報編集 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>サイド情報</Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>キーワード</Typography>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <TextField
                    label="新しいキーワード"
                    size="small"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddKeyword();
                        e.preventDefault();
                      }
                    }}
                  />
                  <IconButton onClick={handleAddKeyword} color="primary">
                    <AddIcon />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {(newspaper.content.sideInfo.keywords || []).map((keyword: string, index: number) => (
                    <Chip
                      key={index}
                      label={keyword}
                      onDelete={() => handleDeleteKeyword(keyword)}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
              
              <TextField
                label="今後の展望"
                fullWidth
                margin="normal"
                multiline
                rows={2}
                value={newspaper.content.sideInfo.futureImplications || ''}
                onChange={(e) => handleChange('sideInfo', 'futureImplications', e.target.value)}
                inputProps={{ maxLength: 200 }}
                helperText={`${(newspaper.content.sideInfo.futureImplications || '').length}/200文字`}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* デザイン編集タブ */}
      {tabValue === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>フォントとテキスト</Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="font-family-label">フォントファミリー</InputLabel>
                <Select
                  labelId="font-family-label"
                  value={newspaper.style.fontFamily || fontOptions[0].value}
                  onChange={(e) => handleChange('style', 'fontFamily', e.target.value)}
                  label="フォントファミリー"
                >
                  {fontOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="headline-size-label">見出しサイズ</InputLabel>
                <Select
                  labelId="headline-size-label"
                  value={newspaper.style.headlineFontSize || '32px'}
                  onChange={(e) => handleChange('style', 'headlineFontSize', e.target.value)}
                  label="見出しサイズ"
                >
                  <MenuItem value="24px">小 (24px)</MenuItem>
                  <MenuItem value="32px">中 (32px)</MenuItem>
                  <MenuItem value="40px">大 (40px)</MenuItem>
                  <MenuItem value="48px">特大 (48px)</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="body-size-label">本文サイズ</InputLabel>
                <Select
                  labelId="body-size-label"
                  value={newspaper.style.bodyFontSize || '16px'}
                  onChange={(e) => handleChange('style', 'bodyFontSize', e.target.value)}
                  label="本文サイズ"
                >
                  <MenuItem value="14px">小 (14px)</MenuItem>
                  <MenuItem value="16px">中 (16px)</MenuItem>
                  <MenuItem value="18px">大 (18px)</MenuItem>
                  <MenuItem value="20px">特大 (20px)</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>カラーとレイアウト</Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="color-scheme-label">カラースキーマ</InputLabel>
                <Select
                  labelId="color-scheme-label"
                  value={newspaper.style.colorScheme || 'classic'}
                  onChange={(e) => applyColorScheme(e.target.value)}
                  label="カラースキーマ"
                >
                  {colorSchemes.map((scheme) => (
                    <MenuItem key={scheme.value} value={scheme.value}>
                      {scheme.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="text-direction-label">テキスト方向</InputLabel>
                <Select
                  labelId="text-direction-label"
                  value={newspaper.style.textDirection || 'vertical-rl'}
                  onChange={(e) => handleChange('style', 'textDirection', e.target.value)}
                  label="テキスト方向"
                >
                  <MenuItem value="vertical-rl">縦書き（右から左）</MenuItem>
                  <MenuItem value="vertical-lr">縦書き（左から右）</MenuItem>
                  <MenuItem value="horizontal-tb">横書き</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="column-count-label">段組数</InputLabel>
                <Select
                  labelId="column-count-label"
                  value={newspaper.style.columnCount || '1'}
                  onChange={(e) => handleChange('style', 'columnCount', e.target.value)}
                  label="段組数"
                >
                  <MenuItem value="1">1段組</MenuItem>
                  <MenuItem value="2">2段組</MenuItem>
                  <MenuItem value="3">3段組</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* メタデータ編集タブ */}
      {tabValue === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>メタデータ</Typography>
          
          <TextField
            label="新聞タイトル"
            fullWidth
            margin="normal"
            value={newspaper.metadata.title || ''}
            onChange={(e) => handleChange('metadata', 'title', e.target.value)}
          />
          
          <TextField
            label="説明"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            value={newspaper.metadata.description || ''}
            onChange={(e) => handleChange('metadata', 'description', e.target.value)}
          />
          
          <TextField
            label="元論文タイトル"
            fullWidth
            margin="normal"
            disabled
            value={newspaper.metadata.paperTitle || ''}
          />
          
          <TextField
            label="作成日"
            fullWidth
            margin="normal"
            disabled
            value={newspaper.metadata.createdAt ? new Date(newspaper.metadata.createdAt).toLocaleString('ja-JP') : ''}
          />
        </Paper>
      )}

      {/* プレビュータブ */}
      {tabValue === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              startIcon={isVerticalPreview ? <EditIcon /> : <PreviewIcon />}
              variant="outlined"
              onClick={() => setIsVerticalPreview(!isVerticalPreview)}
            >
              {isVerticalPreview ? '編集モード' : '縦書きプレビュー'}
            </Button>
          </Box>
          
          <Paper 
            sx={{
              p: 3,
              minHeight: '600px',
              backgroundColor: newspaper.style.backgroundColor || '#f5f5dc',
              color: newspaper.style.textColor || '#000000',
              fontFamily: newspaper.style.fontFamily || '"Noto Serif JP", serif',
              border: `1px solid ${newspaper.style.borderColor || '#8b4513'}`,
              ...previewStyles
            }}
          >
            {/* 新聞タイトル */}
            <Box sx={{ 
              mb: 2, 
              pb: 1, 
              borderBottom: `2px solid ${newspaper.style.borderColor || '#8b4513'}`
            }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  textAlign: isVerticalPreview ? 'right' : 'center',
                  fontWeight: 'bold'
                }}
              >
                {newspaper.metadata.title || '新聞タイトル'}
              </Typography>
            </Box>
            
            {/* メイン見出し */}
            <Box sx={{ 
              mb: 2, 
              p: 1, 
              backgroundColor: newspaper.style.headlineBackgroundColor || '#f0f0d8',
              borderLeft: `4px solid ${newspaper.style.borderColor || '#8b4513'}`,
              borderRight: `4px solid ${newspaper.style.borderColor || '#8b4513'}`,
            }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontSize: newspaper.style.headlineFontSize || '32px',
                  fontWeight: 'bold',
                  mb: 1
                }}
                className={getTextDirectionClass(newspaper.style.textDirection || 'vertical-rl')}
              >
                {newspaper.content.headline.main || 'メイン見出し'}
              </Typography>
              
              <Typography 
                variant="h6"
                sx={{ fontSize: '1.2rem' }}
                className={getTextDirectionClass(newspaper.style.textDirection || 'vertical-rl')}
              >
                {newspaper.content.headline.sub || 'サブ見出し'}
              </Typography>
            </Box>
            
            {/* 記事本文 */}
            <Box sx={{ 
              mb: 3,
              columnCount: isVerticalPreview ? 1 : (newspaper.style.columnCount || 1),
              columnGap: '2rem',
              fontSize: newspaper.style.bodyFontSize || '16px'
            }}
            className={getTextDirectionClass(newspaper.style.textDirection || 'vertical-rl')}
            >
              <Typography paragraph sx={{ fontWeight: 'bold' }}>
                {newspaper.content.content.lead || 'リード文がここに表示されます。'}
              </Typography>
              
              <Typography paragraph style={{ textIndent: '1em', lineHeight: 1.8 }}>
                {newspaper.content.content.body || '本文がここに表示されます。'}
              </Typography>
              
              <Typography paragraph>
                {newspaper.content.content.conclusion || '結論がここに表示されます。'}
              </Typography>
            </Box>
            
            {/* サイド情報 */}
            <Box sx={{ 
              p: 1, 
              border: `1px solid ${newspaper.style.borderColor || '#8b4513'}`,
              backgroundColor: newspaper.style.headlineBackgroundColor || '#f0f0d8',
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                キーワード
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {(newspaper.content.sideInfo.keywords || []).map((keyword: string, index: number) => (
                  <Chip key={index} label={keyword} size="small" />
                ))}
              </Box>
              
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                今後の展望
              </Typography>
              
              <Typography variant="body2">
                {newspaper.content.sideInfo.futureImplications || '今後の展望がここに表示されます。'}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* 保存ボタン（固定位置） */}
      <Box sx={{ position: 'sticky', bottom: 16, textAlign: 'right', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </Button>
      </Box>

      {/* 通知スナックバー */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedNewspaperEditor;