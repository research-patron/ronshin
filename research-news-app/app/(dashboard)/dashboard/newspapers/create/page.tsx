'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-provider';
import { 
  Box, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Grid, 
  Card, 
  CardActionArea, 
  CardContent, 
  CardMedia, 
  Checkbox, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText
} from '@mui/material';
import { 
  Description as DescriptionIcon, 
  Newspaper as NewspaperIcon, 
  ChevronRight as ChevronRightIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

// ステップ定義
const steps = ['論文選択', 'テンプレート選択', '新聞生成'];

export default function CreateNewspaperPage() {
  const { user, getUserData } = useAuth();
  const router = useRouter();
  
  // ステート管理
  const [activeStep, setActiveStep] = useState(0);
  const [userPapers, setUserPapers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [generationStarted, setGenerationStarted] = useState(false);
  const [generatedNewspaperId, setGeneratedNewspaperId] = useState<string | null>(null);
  
  // 警告ダイアログの状態
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningType, setWarningType] = useState<'paper-limit' | 'template-premium' | null>(null);
  
  // ユーザーデータを取得（無料/有料会員の確認）
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const data = await getUserData();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, [user, getUserData]);
  
  // ユーザーの論文を取得
  useEffect(() => {
    const fetchUserPapers = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const papersQuery = query(
          collection(db, 'papers'),
          where('uploaderId', '==', user.uid),
          where('processingStatus', '==', 'completed'), // 処理が完了した論文のみ
          orderBy('createdAt', 'desc')
        );
        
        const papersSnapshot = await getDocs(papersQuery);
        const papersData = papersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUserPapers(papersData);
      } catch (error) {
        console.error('Error fetching papers:', error);
        setError('論文データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserPapers();
  }, [user]);
  
  // テンプレートを取得
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        
        const templatesQuery = query(
          collection(db, 'templates'),
          orderBy('usageCount', 'desc')
        );
        
        const templatesSnapshot = await getDocs(templatesQuery);
        const templatesData = templatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setError('テンプレートの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // 選択済み論文の切り替え
  const togglePaperSelection = (paperId: string) => {
    if (selectedPapers.includes(paperId)) {
      setSelectedPapers(selectedPapers.filter(id => id !== paperId));
    } else {
      // 無料会員は最大5つまで
      if (userData?.membershipTier === 'free' && selectedPapers.length >= 5) {
        // 選択数の上限に達した場合は警告を表示
        setWarningType('paper-limit');
        setWarningOpen(true);
        return;
      }
      
      setSelectedPapers([...selectedPapers, paperId]);
    }
  };
  
  // テンプレート選択
  const handleTemplateSelect = (templateId: string, isPremium: boolean) => {
    // 有料テンプレートを無料会員が選択した場合
    if (isPremium && userData?.membershipTier === 'free') {
      setWarningType('template-premium');
      setWarningOpen(true);
      return;
    }
    
    setSelectedTemplate(templateId);
  };
  
  // 次のステップへ進む
  const handleNext = () => {
    // ステップごとのバリデーション
    if (activeStep === 0 && selectedPapers.length === 0) {
      setError('少なくとも1つの論文を選択してください');
      return;
    }
    
    if (activeStep === 1 && !selectedTemplate) {
      setError('テンプレートを選択してください');
      return;
    }
    
    setActiveStep(prevStep => prevStep + 1);
    setError(null);
    
    // 最後のステップであれば新聞の生成開始
    if (activeStep === 2) {
      handleCreateNewspaper();
    }
  };
  
  // 前のステップに戻る
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
    setError(null);
  };
  
  // 新聞生成処理
  const handleCreateNewspaper = async () => {
    if (!user || selectedPapers.length === 0 || !selectedTemplate) return;
    
    try {
      setLoading(true);
      setError(null);
      setGenerationStarted(true);
      
      // 新聞生成APIを呼び出す
      const response = await fetch('/api/newspapers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paperIds: selectedPapers,
          templateId: selectedTemplate
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '新聞の生成に失敗しました');
      }
      
      const result = await response.json();
      setGeneratedNewspaperId(result.newspaperId);
      
      // 生成が完了したら編集ページに移動
      router.push(`/dashboard/newspapers/${result.newspaperId}/edit`);
    } catch (error: any) {
      console.error('Newspaper creation error:', error);
      setError(error.message || '新聞の生成に失敗しました');
      setGenerationStarted(false);
    } finally {
      setLoading(false);
    }
  };
  
  // ステップごとのコンテンツを取得
  const getStepContent = (step: number) => {
    switch (step) {
      case 0: // 論文選択ステップ
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              新聞に使用する論文を選択してください
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {userData?.membershipTier === 'free' 
                ? '最大5つの論文を選択できます' 
                : '複数の論文を選択できます'}
            </Typography>
            
            {userPapers.length > 0 ? (
              <List>
                {userPapers.map((paper) => (
                  <ListItem disablePadding key={paper.id}>
                    <ListItemButton onClick={() => togglePaperSelection(paper.id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedPapers.includes(paper.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={paper.title || '無題の論文'} 
                        secondary={paper.authors?.join(', ') || '著者不明'}
                      />
                      {paper.processingStatus === 'completed' && (
                        <CheckIcon color="success" />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" gutterBottom>
                  処理が完了した論文がありません
                </Typography>
                <Button 
                  variant="contained" 
                  component="a"
                  href="/dashboard/papers/upload"
                >
                  論文をアップロード
                </Button>
              </Paper>
            )}
          </Box>
        );
        
      case 1: // テンプレート選択ステップ
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              新聞のテンプレートを選択してください
            </Typography>
            
            <Grid container spacing={3}>
              {templates.map((template) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card 
                    sx={{ 
                      border: selectedTemplate === template.id 
                        ? '2px solid #1976d2' 
                        : '1px solid transparent',
                      opacity: template.isPremium && userData?.membershipTier === 'free' ? 0.7 : 1
                    }}
                  >
                    <CardActionArea 
                      onClick={() => handleTemplateSelect(template.id, template.isPremium)}
                    >
                      <CardMedia
                        component="img"
                        height="140"
                        image={template.previewImageUrl || '/template-placeholder.png'}
                        alt={template.name}
                      />
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">
                            {template.name}
                          </Typography>
                          
                          {template.isPremium && (
                            <Typography 
                              variant="caption" 
                              bgcolor={userData?.membershipTier === 'premium' ? 'success.main' : 'warning.main'} 
                              color="white"
                              sx={{ px: 1, py: 0.5, borderRadius: 1 }}
                            >
                              プレミアム
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
        
      case 2: // 新聞生成ステップ
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {generationStarted ? (
              <>
                <Typography variant="h6" gutterBottom>
                  新聞を生成中...
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  論文の解析や新聞の生成には時間がかかります。しばらくお待ちください。
                </Typography>
                <CircularProgress size={60} thickness={4} />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  生成が完了すると自動的に次の画面に移動します
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  設定を確認して新聞を生成します
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  選択した論文: {selectedPapers.length}件
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  選択したテンプレート: {templates.find(t => t.id === selectedTemplate)?.name || ''}
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="body2">
                    {userData?.membershipTier === 'free' 
                      ? `無料会員は月に3回まで新聞を生成できます。今月の残り回数: ${3 - (userData?.generatedCount || 0)}回`
                      : 'プレミアム会員は無制限に新聞を生成できます。'}
                  </Typography>
                </Alert>
              </>
            )}
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        新聞を作成
      </Typography>
      
      {/* ステッパー */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* メインコンテンツ */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {loading && activeStep !== 2 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          getStepContent(activeStep)
        )}
      </Paper>
      
      {/* ナビゲーションボタン */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          disabled={activeStep === 0 || loading || generationStarted}
          onClick={handleBack}
        >
          戻る
        </Button>
        <Button
          variant="contained"
          disabled={
            loading || 
            generationStarted || 
            (activeStep === 0 && selectedPapers.length === 0) ||
            (activeStep === 1 && !selectedTemplate)
          }
          onClick={handleNext}
          endIcon={activeStep === steps.length - 1 ? null : <ChevronRightIcon />}
        >
          {activeStep === steps.length - 1 ? '生成開始' : '次へ'}
        </Button>
      </Box>
      
      {/* 警告ダイアログ */}
      <Dialog
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
      >
        <DialogTitle>
          {warningType === 'paper-limit' ? '論文選択数の上限' : 'プレミアム機能'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {warningType === 'paper-limit' ? (
              '無料会員は最大5つまでの論文を選択できます。より多くの論文を使用するには、プレミアム会員へのアップグレードをご検討ください。'
            ) : (
              'このテンプレートはプレミアム会員専用です。プレミアム会員にアップグレードすると、すべてのテンプレートが使用可能になります。'
            )}
          </DialogContentText>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Button onClick={() => setWarningOpen(false)}>
              閉じる
            </Button>
            <Button 
              variant="contained" 
              component="a"
              href="/dashboard/upgrade"
            >
              アップグレードする
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}