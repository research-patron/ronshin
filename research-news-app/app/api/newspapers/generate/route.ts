import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin/firebase-admin';
import { generateNewspaper } from '@/lib/utils/vertex-ai-client';
import { getErrorMessage } from '@/lib/utils/error-utils';

/**
 * 新聞記事生成APIエンドポイント
 * 
 * リクエスト:
 * - paperId: 論文ID
 * - templateId: テンプレートID
 * 
 * レスポンス:
 * - id: 生成された新聞記事ID
 * - content: 生成された記事内容
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const requestData = await request.json();
    const { paperId, templateId } = requestData;
    
    // パラメータのバリデーション
    if (!paperId || !templateId) {
      return NextResponse.json(
        { error: '論文IDとテンプレートIDは必須です' },
        { status: 400 }
      );
    }
    
    // セッションクッキーからFirebase認証トークンを取得
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    // セッショントークンを検証
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    if (!decodedClaims) {
      return NextResponse.json(
        { error: '認証セッションが無効です' },
        { status: 401 }
      );
    }
    
    // Vertex AI経由で新聞記事を生成
    const result = await generateNewspaper(paperId, templateId);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error generating newspaper:', error);
    
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}