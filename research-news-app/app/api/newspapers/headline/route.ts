import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin/firebase-admin';
import { generateHeadline } from '@/lib/utils/vertex-ai-client';
import { getErrorMessage } from '@/lib/utils/error-utils';

/**
 * 見出し生成APIエンドポイント
 * 
 * リクエスト:
 * - content: 見出しを生成する記事の内容
 * 
 * レスポンス:
 * - main: メイン見出し
 * - sub: サブ見出し
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const requestData = await request.json();
    const { content } = requestData;
    
    // パラメータのバリデーション
    if (!content) {
      return NextResponse.json(
        { error: '記事の内容は必須です' },
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
    
    // Vertex AI経由で見出しを生成
    const result = await generateHeadline(content);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error generating headline:', error);
    
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}