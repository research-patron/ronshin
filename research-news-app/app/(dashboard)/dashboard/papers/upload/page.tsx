'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-provider';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField,
  LinearProgress,
  Alert,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Backdrop,
  CircularProgress
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  UploadFile as UploadFileIcon,
  Check as CheckIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// ドラッグ&ドロップスタイル付きのコンポーネント
const DropzoneArea = styled('div')(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(8),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: theme.palette.action.hover,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  '&.dragActive': {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.success.main,
  }
}));

const steps = ['PDFファイルを選択', 'アップロード', '処理'];

export default function UploadPaperPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [journal, setJournal] = useState('');
  
  // ファイル選択ハンドラー
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  // ドラッグイベントハンドラー
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  // ファイルバリデーション
  const validateAndSetFile = (file: File) => {
    setError(null);
    
    // ファイル形式チェック
    if (file.type !== 'application/pdf') {
      setError('PDFファイルのみアップロードできます。');
      return;
    }
    
    // ファイルサイズチェック (20MB制限)
    if (file.size > 20 * 1024 * 1024) {
      setError('ファイルサイズは20MB以下である必要があります。');
      return;
    }
    
    // 選択したファイルをセット
    setSelectedFile(file);
    
    // タイトルを自動的にファイル名から設定（.pdfを除く）
    const fileName = file.name.replace(/\.pdf$/i, '');
    setTitle(fileName);
    
    // ステップを進める
    setActiveStep(1);
  };
  
  // ファイル選択ボタンのクリックハンドラー
  const handleSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // ファイルアップロードハンドラー
  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      setActiveStep(2);
      
      // FormDataの作成
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // メタデータの追加
      const metadata = {
        title: title || selectedFile.name.replace(/\.pdf$/i, ''),
        authors: authors ? authors.split(',').map(a => a.trim()) : [],
        journal: journal,
      };
      formData.append('metadata', JSON.stringify(metadata));
      
      // アップロード処理
      // 実際のAPIエンドポイントに変更する必要があります
      const response = await fetch('/api/papers/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'アップロードに失敗しました');
      }
      
      const result = await response.json();
      
      // 成功したらリダイレクト
      router.push(`/dashboard/papers/${result.paperId}`);
    } catch (error: any) {
      console.error('Paper upload error:', error);
      setError(error.message || 'アップロード中にエラーが発生しました');
      setActiveStep(1); // エラー時は前のステップに戻る
    } finally {
      setLoading(false);
    }
  };
  
  // ファイルの選択をキャンセル
  const handleCancel = () => {
    setSelectedFile(null);
    setActiveStep(0);
    setTitle('');
    setAuthors('');
    setJournal('');
    setError(null);
    setUploadProgress(0);
    
    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        論文のアップロード
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        {/* ステップ1: ファイル選択 */}
        {activeStep === 0 && (
          <Box>
            <input
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            
            <DropzoneArea
              className={isDragging ? 'dragActive' : ''}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleSelectClick}
            >
              <CloudUploadIcon fontSize="large" color="primary" sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                PDFファイルをドラッグ&ドロップ
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                または
              </Typography>
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadFileIcon />}
              >
                ファイルを選択
              </Button>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                最大ファイルサイズ: 20MB
              </Typography>
            </DropzoneArea>
          </Box>
        )}
        
        {/* ステップ2: メタデータ入力 */}
        {activeStep === 1 && selectedFile && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <UploadFileIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </Typography>
              <Button
                startIcon={<DeleteForeverIcon />}
                color="error"
                sx={{ ml: 'auto' }}
                onClick={handleCancel}
              >
                取り消し
              </Button>
            </Box>
            
            <Stack spacing={3} sx={{ mb: 3 }}>
              <TextField
                label="論文タイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
              />
              
              <TextField
                label="著者 (複数の場合はカンマで区切ってください)"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                fullWidth
                placeholder="例: 山田太郎, 鈴木花子"
              />
              
              <TextField
                label="ジャーナル名"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                fullWidth
              />
            </Stack>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
              >
                キャンセル
              </Button>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!title.trim()}
              >
                アップロード
              </Button>
            </Box>
          </Box>
        )}
        
        {/* ステップ3: 処理中 */}
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" gutterBottom>
              論文を処理中...
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              アップロードが完了したら自動的に次のページに移動します。
            </Typography>
            <CircularProgress sx={{ mt: 2 }} />
          </Box>
        )}
      </Paper>
      
      {/* ローディングバックドロップ */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}