'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import Link from 'next/link';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Button, 
  Paper, 
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  Description as DescriptionIcon, 
  Newspaper as NewspaperIcon, 
  ArrowUpward as ArrowUpwardIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function DashboardPage() {
  const { user, getUserData } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({
    paperCount: 0,
    newspaperCount: 0,
    generatedCount: 0,
    savedCount: 0
  });
  const [recentPapers, setRecentPapers] = useState<any[]>([]);
  const [recentNewspapers, setRecentNewspapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get user data
        const data = await getUserData();
        setUserData(data);

        // Fetch papers
        const papersQuery = query(
          collection(db, 'papers'),
          where('uploaderId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const papersSnapshot = await getDocs(papersQuery);
        const papersData = papersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentPapers(papersData);

        // Fetch newspapers
        const newspapersQuery = query(
          collection(db, 'newspapers'),
          where('creatorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const newspapersSnapshot = await getDocs(newspapersQuery);
        const newspapersData = newspapersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentNewspapers(newspapersData);

        // Set stats
        setStats({
          paperCount: papersSnapshot.size,
          newspaperCount: newspapersSnapshot.size,
          generatedCount: data?.generatedCount || 0,
          savedCount: data?.savedNewspapersCount || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, getUserData]);

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ようこそ、{userData?.displayName || user?.displayName || 'ユーザー'}さん
        </Typography>
        <Typography variant="body1" color="text.secondary">
          ダッシュボードから論文のアップロードや新聞の作成、管理ができます。
        </Typography>
      </Box>

      {/* Membership status */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 4, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          background: userData?.membershipTier === 'premium' ? '#f0f7ff' : '#fff'
        }}
      >
        <Box>
          <Typography variant="h6">
            現在の会員ステータス: 
            <Chip 
              label={userData?.membershipTier === 'premium' ? 'プレミアム会員' : '無料会員'} 
              color={userData?.membershipTier === 'premium' ? 'primary' : 'default'}
              sx={{ ml: 1 }}
            />
          </Typography>
          {userData?.membershipTier === 'free' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              無料会員は月{3 - (userData?.generatedCount || 0)}回の新聞生成と{10 - (userData?.savedNewspapersCount || 0)}件の新聞保存が可能です。
            </Typography>
          )}
        </Box>
        {userData?.membershipTier === 'free' && (
          <Button variant="contained" component={Link} href="/dashboard/upgrade">
            プレミアムへアップグレード
          </Button>
        )}
      </Paper>

      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                アップロード論文
              </Typography>
              <Typography variant="h3" component="div">
                {stats.paperCount}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1.5 }}>
                <ArrowForwardIcon fontSize="small" />
                {' '}
                <Link href="/dashboard/papers" style={{ textDecoration: 'none' }}>
                  すべて表示
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                作成した新聞
              </Typography>
              <Typography variant="h3" component="div">
                {stats.newspaperCount}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1.5 }}>
                <ArrowForwardIcon fontSize="small" />
                {' '}
                <Link href="/dashboard/newspapers" style={{ textDecoration: 'none' }}>
                  すべて表示
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                今月の作成回数
              </Typography>
              <Typography variant="h3" component="div">
                {stats.generatedCount}
                {userData?.membershipTier === 'free' && (
                  <Typography component="span" variant="subtitle1" sx={{ ml: 1 }}>
                    / 3
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1.5 }}>
                {userData?.membershipTier === 'free' ? (
                  `あと${3 - stats.generatedCount}回生成可能`
                ) : (
                  '無制限'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                保存した新聞
              </Typography>
              <Typography variant="h3" component="div">
                {stats.savedCount}
                {userData?.membershipTier === 'free' && (
                  <Typography component="span" variant="subtitle1" sx={{ ml: 1 }}>
                    / 10
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1.5 }}>
                {userData?.membershipTier === 'free' ? (
                  `あと${10 - stats.savedCount}件保存可能`
                ) : (
                  '無制限'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          クイックアクション
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              variant="outlined" 
              startIcon={<DescriptionIcon />} 
              fullWidth
              component={Link}
              href="/dashboard/papers/upload"
              sx={{ p: 1.5 }}
            >
              論文をアップロード
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              variant="outlined" 
              startIcon={<NewspaperIcon />} 
              fullWidth
              component={Link}
              href="/dashboard/newspapers/create"
              sx={{ p: 1.5 }}
            >
              新聞を作成
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Recent papers */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          最近のアップロード論文
        </Typography>
        {recentPapers.length > 0 ? (
          <Grid container spacing={2}>
            {recentPapers.map((paper) => (
              <Grid item xs={12} sm={6} md={4} key={paper.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" noWrap sx={{ mb: 1 }}>
                      {paper.title || '無題の論文'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      アップロード日: {paper.createdAt?.toDate().toLocaleDateString() || '不明'}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button 
                        size="small" 
                        component={Link}
                        href={`/dashboard/papers/${paper.id}`}
                      >
                        詳細を表示
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1">
              まだ論文がアップロードされていません。
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<ArrowUpwardIcon />}
              component={Link}
              href="/dashboard/papers/upload"
              sx={{ mt: 2 }}
            >
              論文をアップロード
            </Button>
          </Paper>
        )}
      </Box>

      {/* Recent newspapers */}
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>
          最近作成した新聞
        </Typography>
        {recentNewspapers.length > 0 ? (
          <Grid container spacing={2}>
            {recentNewspapers.map((newspaper) => (
              <Grid item xs={12} sm={6} md={4} key={newspaper.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" noWrap sx={{ mb: 1 }}>
                      {newspaper.title || '無題の新聞'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      作成日: {newspaper.createdAt?.toDate().toLocaleDateString() || '不明'}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button 
                        size="small" 
                        component={Link}
                        href={`/dashboard/newspapers/${newspaper.id}`}
                      >
                        詳細を表示
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1">
              まだ新聞が作成されていません。
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<NewspaperIcon />}
              component={Link}
              href="/dashboard/newspapers/create"
              sx={{ mt: 2 }}
            >
              新聞を作成
            </Button>
          </Paper>
        )}
      </Box>
    </Box>
  );
}