'use client';

import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Link as LinkIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { 
  generatePdfFromElement, 
  optimizeElementForPdf, 
  downloadPdf 
} from '@/utils/pdf-generator';

interface NewspaperActionsProps {
  newspaperId: string;
  newspaperTitle: string;
  contentRef: React.RefObject<HTMLElement>;
  onShare?: (type: 'email' | 'link' | 'twitter' | 'facebook') => void;
}

const NewspaperActions: React.FC<NewspaperActionsProps> = ({
  newspaperId,
  newspaperTitle,
  contentRef,
  onShare
}) => {
  // UI状態
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // メニュー状態
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  
  // PDF出力ダイアログ
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfSize, setPdfSize] = useState<'a4' | 'a3' | 'letter'>('a4');
  
  // 共有メニューの開閉
  const handleShareMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };
  
  const handleShareMenuClose = () => {
    setShareMenuAnchor(null);
  };
  
  // その他メニューの開閉
  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };
  
  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };
  
  // PDF出力ダイアログの開閉
  const handlePdfDialogOpen = () => {
    setPdfDialogOpen(true);
    handleMoreMenuClose();
  };
  
  const handlePdfDialogClose = () => {
    setPdfDialogOpen(false);
  };
  
  // PDF生成
  const handleGeneratePdf = async () => {
    if (!contentRef.current) {
      setError('新聞コンテンツが見つかりません');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 表示要素をPDF用に最適化
      const optimizedElement = optimizeElementForPdf(contentRef.current);
      document.body.appendChild(optimizedElement);
      
      // PDF生成オプションの設定
      const options = {
        title: newspaperTitle || '新聞',
        fileName: `${newspaperTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: pdfOrientation,
        paperSize: pdfSize,
        margin: 10,
        quality: 0.95
      };
      
      // PDF生成
      const pdfUrl = await generatePdfFromElement(optimizedElement, options);
      
      // 最適化用の一時要素を削除
      document.body.removeChild(optimizedElement);
      
      // PDFのダウンロード
      downloadPdf(pdfUrl, options.fileName);
      
      setSuccess('PDFが正常に生成されました');
      handlePdfDialogClose();
    } catch (err) {
      console.error('PDF generation error:', err);
      setError(`PDF生成中にエラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 印刷機能
  const handlePrint = () => {
    window.print();
    handleMoreMenuClose();
  };
  
  // 共有機能
  const handleShare = (type: 'email' | 'link' | 'twitter' | 'facebook') => {
    if (onShare) {
      onShare(type);
    } else {
      // 基本的な共有機能の実装
      const url = `${window.location.origin}/newspapers/${newspaperId}`;
      
      switch (type) {
        case 'email':
          window.open(`mailto:?subject=${encodeURIComponent(`研究新聞: ${newspaperTitle}`)}&body=${encodeURIComponent(`${newspaperTitle}\n\n${url}`)}`);
          break;
        case 'link':
          navigator.clipboard.writeText(url)
            .then(() => setSuccess('リンクがクリップボードにコピーされました'))
            .catch(() => setError('リンクのコピーに失敗しました'));
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(newspaperTitle)}&url=${encodeURIComponent(url)}`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
          break;
      }
    }
    
    handleShareMenuClose();
  };
  
  return (
    <>
      {/* アクションボタン */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={handlePdfDialogOpen}
          size="small"
        >
          PDF出力
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          size="small"
        >
          印刷
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={handleShareMenuOpen}
          size="small"
        >
          共有
        </Button>
        
        <IconButton
          onClick={handleMoreMenuOpen}
          size="small"
        >
          <MoreIcon />
        </IconButton>
      </Box>
      
      {/* 共有メニュー */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={handleShareMenuClose}
      >
        <MenuItem onClick={() => handleShare('email')}>
          <EmailIcon fontSize="small" sx={{ mr: 1 }} />
          メール
        </MenuItem>
        <MenuItem onClick={() => handleShare('link')}>
          <LinkIcon fontSize="small" sx={{ mr: 1 }} />
          リンクをコピー
        </MenuItem>
        <MenuItem onClick={() => handleShare('twitter')}>
          <TwitterIcon fontSize="small" sx={{ mr: 1 }} />
          Twitter
        </MenuItem>
        <MenuItem onClick={() => handleShare('facebook')}>
          <FacebookIcon fontSize="small" sx={{ mr: 1 }} />
          Facebook
        </MenuItem>
      </Menu>
      
      {/* その他メニュー */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreMenuClose}
      >
        <MenuItem onClick={handlePdfDialogOpen}>
          <PdfIcon fontSize="small" sx={{ mr: 1 }} />
          PDF出力オプション
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <PrintIcon fontSize="small" sx={{ mr: 1 }} />
          印刷プレビュー
        </MenuItem>
        <MenuItem onClick={() => window.location.reload()}>
          再読み込み
        </MenuItem>
      </Menu>
      
      {/* PDF出力ダイアログ */}
      <Dialog
        open={pdfDialogOpen}
        onClose={handlePdfDialogClose}
        aria-labelledby="pdf-dialog-title"
      >
        <DialogTitle id="pdf-dialog-title">
          PDF出力オプション
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            用紙サイズ
          </Typography>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup
              value={pdfSize}
              onChange={(e) => setPdfSize(e.target.value as 'a4' | 'a3' | 'letter')}
              row
            >
              <FormControlLabel value="a4" control={<Radio />} label="A4" />
              <FormControlLabel value="a3" control={<Radio />} label="A3" />
              <FormControlLabel value="letter" control={<Radio />} label="レター" />
            </RadioGroup>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom>
            向き
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={pdfOrientation}
              onChange={(e) => setPdfOrientation(e.target.value as 'portrait' | 'landscape')}
              row
            >
              <FormControlLabel value="portrait" control={<Radio />} label="縦向き" />
              <FormControlLabel value="landscape" control={<Radio />} label="横向き" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handlePdfDialogClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleGeneratePdf}
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            disabled={loading}
          >
            {loading ? '生成中...' : 'PDFをダウンロード'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 通知スナックバー */}
      <Snackbar
        open={Boolean(success) || Boolean(error)}
        autoHideDuration={6000}
        onClose={() => {
          setSuccess(null);
          setError(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {success ? (
          <Alert 
            onClose={() => setSuccess(null)} 
            severity="success"
            sx={{ width: '100%' }}
          >
            {success}
          </Alert>
        ) : (
          <Alert 
            onClose={() => setError(null)} 
            severity="error"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

export default NewspaperActions;