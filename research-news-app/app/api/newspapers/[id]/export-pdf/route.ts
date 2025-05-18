import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/lib/firebase-admin/firebase-admin';
import { cookies } from 'next/headers';
import { generateAndUploadPdf, createPdfExportInfo } from '@/lib/utils/pdf-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const newspaperId = params.id;
    
    // リクエストボディを取得
    const { htmlContent, options } = await request.json();
    
    if (!htmlContent) {
      return NextResponse.json(
        { success: false, error: 'HTMLコンテンツが提供されていません' },
        { status: 400 }
      );
    }
    
    // 新聞データの取得
    const newspaperDoc = await firestore.collection('newspapers').doc(newspaperId).get();
    
    if (!newspaperDoc.exists) {
      return NextResponse.json(
        { success: false, error: '指定された新聞が見つかりません' },
        { status: 404 }
      );
    }
    
    const newspaperData = newspaperDoc.data();
    
    // 権限チェック
    const isOwner = newspaperData.creatorId === userId;
    const isPublic = newspaperData.isPublic === true;
    const isSharedWithUser = false; // 実際にはグループ共有の確認ロジックが必要
    
    if (!isOwner && !isPublic && !isSharedWithUser) {
      return NextResponse.json(
        { success: false, error: 'この新聞へのアクセス権限がありません' },
        { status: 403 }
      );
    }
    
    // PDFを生成してアップロード
    const pdfOptions = {
      title: newspaperData.title || '新聞',
      fileName: `${newspaperData.title || 'newspaper'}_${Date.now()}.pdf`,
      orientation: 'portrait',
      paperSize: 'a3',
      margin: 10,
      compress: true,
      quality: 0.9,
      ...options
    };
    
    // PDFを生成し、Firebase Storageにアップロード
    const pdfUrl = await generateAndUploadPdf(htmlContent, newspaperId, pdfOptions);
    
    // エクスポート履歴を更新
    const exportInfo = createPdfExportInfo(userId, pdfUrl);
    
    // 既存のエクスポート履歴を取得または作成
    const exportHistory = newspaperData.exportHistory || [];
    
    // 新しいエクスポート履歴を追加して更新
    await firestore.collection('newspapers').doc(newspaperId).update({
      exportHistory: [...exportHistory, exportInfo],
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({
      success: true,
      pdfUrl
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'PDFのエクスポートに失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const newspaperId = params.id;
    
    // 新聞データの取得
    const newspaperDoc = await firestore.collection('newspapers').doc(newspaperId).get();
    
    if (!newspaperDoc.exists) {
      return NextResponse.json(
        { success: false, error: '指定された新聞が見つかりません' },
        { status: 404 }
      );
    }
    
    const newspaperData = newspaperDoc.data();
    
    // 権限チェック
    const isOwner = newspaperData.creatorId === userId;
    const isPublic = newspaperData.isPublic === true;
    const isSharedWithUser = false; // 実際にはグループ共有の確認ロジックが必要
    
    if (!isOwner && !isPublic && !isSharedWithUser) {
      return NextResponse.json(
        { success: false, error: 'この新聞へのアクセス権限がありません' },
        { status: 403 }
      );
    }
    
    // 既存のPDFがあるかチェック
    const exportHistoryItems = newspaperData.exportHistory || [];
    const pdfExport = exportHistoryItems.find((item: any) => item.type === 'pdf');
    
    if (pdfExport && pdfExport.url) {
      // 既存のPDFを返す
      return NextResponse.json({
        success: true,
        pdfUrl: pdfExport.url
      });
    }
    
    // PDFが存在しない場合
    return NextResponse.json({
      success: false,
      error: 'PDFエクスポートが見つかりません。新しくエクスポートしてください。',
      needsGeneration: true
    });
  } catch (error) {
    console.error('PDF retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'PDFの取得に失敗しました' },
      { status: 500 }
    );
  }
}