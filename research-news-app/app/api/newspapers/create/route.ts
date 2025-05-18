import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { firestore, auth } from '@/lib/firebase-admin/firebase-admin';
import { cookies } from 'next/headers';

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
    
    // リクエストボディの解析
    const { paperIds, templateId } = await request.json();
    
    // バリデーション
    if (!paperIds || !Array.isArray(paperIds) || paperIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '論文IDが指定されていません' },
        { status: 400 }
      );
    }
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'テンプレートIDが指定されていません' },
        { status: 400 }
      );
    }
    
    // ユーザー情報を取得
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    
    // 無料会員の制限チェック
    if (userData.membershipTier === 'free') {
      // 月間生成回数のチェック
      if (userData.generatedCount >= 3) {
        return NextResponse.json(
          { success: false, error: '無料会員の月間生成回数上限（3回）に達しました' },
          { status: 403 }
        );
      }
      
      // テンプレート使用可能チェック
      const templateDoc = await firestore.collection('templates').doc(templateId).get();
      if (!templateDoc.exists) {
        return NextResponse.json(
          { success: false, error: '指定されたテンプレートが存在しません' },
          { status: 404 }
        );
      }
      
      const templateData = templateDoc.data();
      if (templateData.isPremium) {
        return NextResponse.json(
          { success: false, error: 'このテンプレートは有料会員専用です' },
          { status: 403 }
        );
      }
    }
    
    // 論文データの検証
    const paperPromises = paperIds.map(id => 
      firestore.collection('papers').doc(id).get()
    );
    const paperDocs = await Promise.all(paperPromises);
    
    // 存在しない論文のチェック
    const invalidPapers = paperDocs.filter(doc => !doc.exists);
    if (invalidPapers.length > 0) {
      return NextResponse.json(
        { success: false, error: '指定された論文が見つかりません' },
        { status: 404 }
      );
    }
    
    // 処理未完了の論文のチェック
    const incompletePapers = paperDocs.filter(doc => 
      doc.data().processingStatus !== 'completed'
    );
    if (incompletePapers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'まだ処理が完了していない論文が含まれています' },
        { status: 400 }
      );
    }
    
    // 新規新聞ID生成
    const newspaperId = uuidv4();
    
    // 今日の日付
    const today = new Date();
    const dateStr = today.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    // 新聞エントリ作成
    await firestore.collection('newspapers').doc(newspaperId).set({
      id: newspaperId,
      creatorId: userId,
      title: `新聞 - ${new Date().toLocaleDateString('ja-JP')}`,
      templateId,
      isPublic: false,
      shareSettings: {
        type: 'private',
        groupIds: [],
        viewCount: 0
      },
      content: {
        header: {
          newspaperName: "学術新聞",
          date: dateStr,
          issueNumber: `第${Math.floor(Math.random() * 1000) + 1}号`
        },
        // 初期コンテンツは空
      },
      customSettings: {
        fontFamily: 'default',
        colorScheme: 'default'
      },
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    // 無料会員の場合、生成回数を更新
    if (userData.membershipTier === 'free') {
      await firestore.collection('users').doc(userId).update({
        generatedCount: firestore.FieldValue.increment(1),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    }
    
    // テンプレートの使用回数を更新
    await firestore.collection('templates').doc(templateId).update({
      usageCount: firestore.FieldValue.increment(1)
    });
    
    // 非同期で新聞生成処理をトリガー
    triggerNewspaperGeneration(newspaperId, userId, paperIds, templateId);
    
    return NextResponse.json({
      success: true,
      newspaperId
    });
  } catch (error) {
    console.error('Newspaper creation error:', error);
    return NextResponse.json(
      { success: false, error: '新聞の作成に失敗しました' },
      { status: 500 }
    );
  }
}

// 新聞生成をトリガーする関数
// この関数は実際のアプリケーションでは非同期で処理されます
async function triggerNewspaperGeneration(
  newspaperId: string,
  userId: string,
  paperIds: string[],
  templateId: string
) {
  try {
    // ここでVertex AIを使用して新聞コンテンツを生成
    // 実際の実装ではCloud FunctionsやVertex AIクライアントを使用
    
    // 論文データの取得
    const paperPromises = paperIds.map(id => 
      firestore.collection('papers').doc(id).get()
    );
    const paperDocs = await Promise.all(paperPromises);
    const papers = paperDocs.map(doc => doc.data());
    
    // 模擬的に少し待機してから内容を更新
    setTimeout(async () => {
      // メインの論文を選択（最初のものを使用）
      const mainPaper = papers[0];
      const subPapers = papers.slice(1);
      
      // 新聞コンテンツの生成（実際にはVertex AIから生成されるべき）
      const newspaperContent = {
        header: {
          newspaperName: "学術新聞",
          date: new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          }),
          issueNumber: `第${Math.floor(Math.random() * 1000) + 1}号`
        },
        mainArticle: {
          headline: `${mainPaper.title || '無題の論文'} - 画期的な研究成果`,
          subheadline: `${mainPaper.authors?.join(', ') || '著者不明'} による最新の研究`,
          content: mainPaper.aiAnalysis?.summary || '論文の要約（実際にはVertex AIから生成されます）',
          imageUrl: '', // 実際にはPDFから抽出した画像などを使用
          paperIds: [mainPaper.id]
        },
        subArticles: subPapers.map(paper => ({
          headline: `${paper.title || '無題の論文'} - 注目の研究`,
          content: paper.aiAnalysis?.summary || '論文の要約（実際にはVertex AIから生成されます）',
          imageUrl: '', // 実際にはPDFから抽出した画像などを使用
          paperId: paper.id
        })),
        sidebarContent: `関連キーワード: ${papers.flatMap(p => p.aiAnalysis?.keypoints || []).join(', ')}`,
        columnContent: `研究分野の解説: ${mainPaper.aiAnalysis?.academicField || '学術分野'} に関する研究は...`,
        footer: `© ${new Date().getFullYear()} Research News Network. 本紙は学術論文を基に生成されたものです。原論文の権利は各著者に帰属します。`
      };
      
      // 新聞コンテンツの更新
      await firestore.collection('newspapers').doc(newspaperId).update({
        content: newspaperContent,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      
    }, 10000); // 10秒後に完了（デモ用）
    
  } catch (error) {
    console.error('Newspaper generation error:', error);
    
    // エラー処理
    try {
      await firestore.collection('newspapers').doc(newspaperId).update({
        error: {
          message: 'コンテンツ生成に失敗しました',
          timestamp: firestore.FieldValue.serverTimestamp()
        },
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      console.error('Failed to update newspaper status:', updateError);
    }
  }
}