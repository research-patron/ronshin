'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-provider';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Card, 
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  CheckCircle as CheckIcon, 
  Cancel as CancelIcon, 
  Star as StarIcon, 
  StarBorder as StarBorderIcon,
  CreditCard as CreditCardIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';

interface SubscriptionInfo {
  planType: string;
  startDate: Date | null;
  endDate: Date | null;
  paymentId: string | null;
  limits: {
    generationsPerMonth: number | 'unlimited';
    templateCount: number;
    savedNewspapersLimit: number | 'unlimited';
    customLogoEnabled: boolean;
    detailedSummaryEnabled: boolean;
    showAds: boolean;
  };
}

export default function UpgradePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // 状態管理
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  
  // サブスクリプション情報の取得
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const response = await fetch('/api/stripe/subscription');
        
        if (!response.ok) {
          throw new Error('サブスクリプション情報の取得に失敗しました');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setSubscription(data.subscription);
        } else {
          throw new Error(data.error || 'サブスクリプション情報の取得に失敗しました');
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscriptionInfo();
  }, [user]);
  
  // プラン変更処理
  const handleChangePlan = async (planType: 'free' | 'premium') => {
    if (!user) return;
    
    try {
      setProcessing(true);
      
      const response = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      });
      
      if (!response.ok) {
        throw new Error('プラン変更に失敗しました');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message || 'プランを変更しました');
        
        // 最新のサブスクリプション情報を再取得
        const updatedResponse = await fetch('/api/stripe/subscription');
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          if (updatedData.success) {
            setSubscription(updatedData.subscription);
          }
        }
      } else {
        throw new Error(data.error || 'プラン変更に失敗しました');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
    } finally {
      setProcessing(false);
      setUpgradeDialogOpen(false);
      setDowngradeDialogOpen(false);
    }
  };
  
  // プレミアムへアップグレード確認ダイアログ
  const handleUpgradeConfirm = () => {
    setUpgradeDialogOpen(true);
  };
  
  // 無料プランへダウングレード確認ダイアログ
  const handleDowngradeConfirm = () => {
    setDowngradeDialogOpen(true);
  };
  
  // ローディング表示
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        プラン管理
      </Typography>
      
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* 現在のプラン情報 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              現在のプラン
            </Typography>
            <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
              {subscription?.planType === 'premium' ? (
                <>
                  <StarIcon sx={{ mr: 1 }} />
                  プレミアムプラン
                </>
              ) : (
                <>
                  <StarBorderIcon sx={{ mr: 1 }} />
                  無料プラン
                </>
              )}
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color={subscription?.planType === 'premium' ? 'error' : 'primary'}
            onClick={subscription?.planType === 'premium' ? handleDowngradeConfirm : handleUpgradeConfirm}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            {subscription?.planType === 'premium' ? '無料プランに戻す' : 'プレミアムにアップグレード'}
          </Button>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              プラン詳細
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="会員種別" 
                  secondary={subscription?.planType === 'premium' ? 'プレミアム会員' : '無料会員'} 
                />
              </ListItem>
              
              {subscription?.startDate && (
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="開始日" 
                    secondary={new Date(subscription.startDate).toLocaleDateString()} 
                  />
                </ListItem>
              )}
              
              {subscription?.planType === 'premium' && subscription?.endDate && (
                <ListItem>
                  <ListItemIcon>
                    <CancelIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="有効期限" 
                    secondary={new Date(subscription.endDate).toLocaleDateString()} 
                  />
                </ListItem>
              )}
              
              <ListItem>
                <ListItemIcon>
                  <CreditCardIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="支払い方法" 
                  secondary={subscription?.paymentId ? 'クレジットカード' : '未登録'} 
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              利用制限
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  {typeof subscription?.limits.generationsPerMonth === 'number' ? (
                    <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                      {subscription.limits.generationsPerMonth}
                    </Typography>
                  ) : (
                    <CheckIcon color="success" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary="月間生成回数" 
                  secondary={typeof subscription?.limits.generationsPerMonth === 'number' 
                    ? `月${subscription.limits.generationsPerMonth}回まで` 
                    : '無制限'} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                    {subscription?.limits.templateCount}
                  </Typography>
                </ListItemIcon>
                <ListItemText 
                  primary="使用可能テンプレート数" 
                  secondary={`${subscription?.limits.templateCount}種類`} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {typeof subscription?.limits.savedNewspapersLimit === 'number' ? (
                    <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                      {subscription.limits.savedNewspapersLimit}
                    </Typography>
                  ) : (
                    <CheckIcon color="success" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary="保存可能な新聞数" 
                  secondary={typeof subscription?.limits.savedNewspapersLimit === 'number' 
                    ? `最大${subscription.limits.savedNewspapersLimit}件` 
                    : '無制限'} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {subscription?.limits.customLogoEnabled ? (
                    <CheckIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary="カスタムロゴ" 
                  secondary={subscription?.limits.customLogoEnabled ? '利用可能' : '利用不可'} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {subscription?.limits.detailedSummaryEnabled ? (
                    <CheckIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary="詳細サマリー" 
                  secondary={subscription?.limits.detailedSummaryEnabled ? '利用可能' : '利用不可'} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {!subscription?.limits.showAds ? (
                    <CheckIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary="広告表示" 
                  secondary={!subscription?.limits.showAds ? '非表示' : '表示あり'} 
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>
      
      {/* プランの比較 */}
      <Typography variant="h5" gutterBottom>
        プラン比較
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 無料プラン */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: subscription?.planType === 'free' ? '2px solid #1976d2' : 'none'
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="div" gutterBottom>
                無料プラン
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                ¥0 / 月
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="月3回までの新聞生成" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="最大10件の新聞保存" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="標準テンプレート（3種類）" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="PDFダウンロード" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CancelIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary="広告表示あり" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CancelIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary="カスタムロゴ追加機能なし" />
                </ListItem>
              </List>
            </CardContent>
            
            <CardActions sx={{ p: 2, pt: 0 }}>
              {subscription?.planType === 'premium' ? (
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                  onClick={handleDowngradeConfirm}
                  disabled={processing}
                >
                  ダウングレード
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="success" 
                  fullWidth
                  disabled
                >
                  現在のプラン
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
        
        {/* プレミアムプラン */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              border: subscription?.planType === 'premium' ? '2px solid #1976d2' : 'none',
              bgcolor: '#fafafa'
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StarIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" component="div">
                  プレミアムプラン
                </Typography>
              </Box>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                ¥800 / 月（年払い：¥8,000 / 年）
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="無制限の新聞生成" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="無制限の新聞保存" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="全テンプレート（10種類）" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="論文要約機能（詳細サマリー）" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="カスタムロゴ追加機能" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="広告表示なし" />
                </ListItem>
              </List>
            </CardContent>
            
            <CardActions sx={{ p: 2, pt: 0 }}>
              {subscription?.planType === 'premium' ? (
                <Button 
                  variant="contained" 
                  color="success" 
                  fullWidth
                  disabled
                >
                  現在のプラン
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={handleUpgradeConfirm}
                  disabled={processing}
                >
                  アップグレード
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* アップグレード確認ダイアログ */}
      <Dialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
      >
        <DialogTitle>プレミアムプランにアップグレード</DialogTitle>
        <DialogContent>
          <DialogContentText>
            プレミアムプランでは以下の機能が利用できるようになります：
          </DialogContentText>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="無制限の新聞生成" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="無制限の新聞保存" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="全テンプレート（10種類）の使用" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="広告表示なし" />
            </ListItem>
          </List>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
            月額800円のプレミアムプランにアップグレードしますか？
          </DialogContentText>
          <DialogContentText sx={{ mt: 1, fontSize: 'small', color: 'text.secondary' }}>
            ※ 現在はデモ実装のため、実際の課金は発生しません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)}>キャンセル</Button>
          <Button 
            onClick={() => handleChangePlan('premium')} 
            variant="contained" 
            color="primary"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            アップグレード
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* ダウングレード確認ダイアログ */}
      <Dialog
        open={downgradeDialogOpen}
        onClose={() => setDowngradeDialogOpen(false)}
      >
        <DialogTitle>無料プランにダウングレード</DialogTitle>
        <DialogContent>
          <DialogContentText>
            無料プランにダウングレードすると、以下の制限が発生します：
          </DialogContentText>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CancelIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="月3回までの新聞生成" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CancelIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="最大10件までの新聞保存" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CancelIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="標準テンプレート（3種類）のみ使用可能" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CancelIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="広告が表示されます" />
            </ListItem>
          </List>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
            本当に無料プランにダウングレードしますか？
          </DialogContentText>
          <DialogContentText sx={{ mt: 1, fontSize: 'small', color: 'text.secondary' }}>
            ※ 現在はデモ実装のため、実際のプラン変更処理は発生しません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDowngradeDialogOpen(false)}>キャンセル</Button>
          <Button 
            onClick={() => handleChangePlan('free')} 
            variant="contained" 
            color="error"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            ダウングレード
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 成功メッセージ */}
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}