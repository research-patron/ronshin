import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/lib/firebase-admin/firebase-admin';
import { cookies } from 'next/headers';

/**
 * サブスクリプション作成エンドポイント
 * Stripe APIと連携して会員プランを設定する（仮実装）
 */
export async function POST(request: NextRequest) {
  try {
    // セッション確認
    const sessionCookie = cookies().get('auth-token')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    // トークン検証
    let userId;
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      userId = decodedClaims.uid;
    } catch (error) {
      console.error('Error verifying session:', error);
      return NextResponse.json(
        { success: false, error: '認証が無効です' },
        { status: 401 }
      );
    }
    
    // リクエストボディを取得
    const { planType } = await request.json();
    
    if (!planType || !['free', 'premium'].includes(planType)) {
      return NextResponse.json(
        { success: false, error: '無効なプラン種別です' },
        { status: 400 }
      );
    }
    
    // ユーザーデータの取得
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    
    // 現在のプランと同じ場合は変更なし
    if (userData.membershipTier === planType) {
      return NextResponse.json({
        success: true,
        message: '既に同じプランに登録されています',
        planType
      });
    }
    
    // プラン変更処理
    // 実際の実装ではここでStripe APIを呼び出して処理を行う
    
    // プラン情報を更新（仮実装）
    const now = firestore.FieldValue.serverTimestamp();
    let endDate = null;
    
    if (planType === 'premium') {
      // プレミアムプランは1年間有効とする（仮実装）
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      endDate = oneYearLater;
    }
    
    await firestore.collection('users').doc(userId).update({
      membershipTier: planType,
      membershipStartDate: now,
      membershipEndDate: endDate,
      updatedAt: now
    });
    
    return NextResponse.json({
      success: true,
      message: `プランを${planType === 'premium' ? 'プレミアム' : '無料'}に変更しました`,
      planType
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'サブスクリプション処理に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * サブスクリプション情報取得エンドポイント
 */
export async function GET(request: NextRequest) {
  try {
    // セッション確認
    const sessionCookie = cookies().get('auth-token')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    // トークン検証
    let userId;
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      userId = decodedClaims.uid;
    } catch (error) {
      console.error('Error verifying session:', error);
      return NextResponse.json(
        { success: false, error: '認証が無効です' },
        { status: 401 }
      );
    }
    
    // ユーザーデータの取得
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    
    // サブスクリプション情報を返す
    return NextResponse.json({
      success: true,
      subscription: {
        planType: userData.membershipTier || 'free',
        startDate: userData.membershipStartDate?.toDate() || null,
        endDate: userData.membershipEndDate?.toDate() || null,
        paymentId: userData.paymentId || null,
        // 仮実装の機能制限情報
        limits: {
          generationsPerMonth: userData.membershipTier === 'premium' ? 'unlimited' : 3,
          templateCount: userData.membershipTier === 'premium' ? 10 : 3,
          savedNewspapersLimit: userData.membershipTier === 'premium' ? 'unlimited' : 10,
          customLogoEnabled: userData.membershipTier === 'premium',
          detailedSummaryEnabled: userData.membershipTier === 'premium',
          showAds: userData.membershipTier !== 'premium'
        }
      }
    });
  } catch (error) {
    console.error('Subscription info error:', error);
    return NextResponse.json(
      { success: false, error: 'サブスクリプション情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}