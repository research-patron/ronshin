import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { parse } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase/firebase';
import { firestore, auth } from '@/lib/firebase-admin/firebase-admin';
import { cookies } from 'next/headers';

// 最大ファイルサイズ: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

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

    // マルチパートフォームデータを解析
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが提供されていません' },
        { status: 400 }
      );
    }
    
    // ファイルタイプの確認
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'PDFファイルのみアップロードできます' },
        { status: 400 }
      );
    }
    
    // ファイルサイズの確認
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'ファイルサイズは20MB以下にしてください' },
        { status: 400 }
      );
    }
    
    // メタデータの取得
    let metadata = {};
    const metadataStr = formData.get('metadata');
    if (metadataStr && typeof metadataStr === 'string') {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (error) {
        console.warn('Invalid metadata JSON', error);
      }
    }
    
    // バッファに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Firebase Storageへのアップロード
    const paperId = uuidv4();
    const fileName = `${paperId}.pdf`;
    const storagePath = `papers/${userId}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    // Firestoreのpapersコレクションに保存
    await setDoc(doc(db, 'papers', paperId), {
      id: paperId,
      uploaderId: userId,
      title: metadata.title || file.name.replace(/\.pdf$/i, ''),
      authors: metadata.authors || [],
      journal: metadata.journal || '',
      fileSize: file.size,
      processingStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // バッファをアップロード
    const uploadTask = uploadBytesResumable(storageRef, buffer, {
      contentType: 'application/pdf',
    });
    
    // アップロード完了を待つ
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // 進捗状況（必要に応じて）
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          // エラー処理
          console.error('Upload failed:', error);
          reject(error);
        },
        () => {
          // 完了
          resolve();
        }
      );
    });
    
    // ダウンロードURLの取得
    const downloadURL = await getDownloadURL(storageRef);
    
    // Firestoreのデータを更新
    await firestore.collection('papers').doc(paperId).update({
      fileUrl: downloadURL,
      updatedAt: serverTimestamp()
    });
    
    // 非同期でVertex AIによる解析をトリガー
    // 実際のアプリケーションではCloud Functionsやバックグラウンドジョブで処理
    triggerPaperAnalysis(paperId);
    
    return NextResponse.json({
      success: true,
      paperId,
      fileUrl: downloadURL
    });
  } catch (error) {
    console.error('Paper upload error:', error);
    return NextResponse.json(
      { success: false, error: '論文のアップロードに失敗しました' },
      { status: 500 }
    );
  }
}

// 論文解析をトリガーする関数
// この関数は実際のアプリケーションでは非同期で処理されます
async function triggerPaperAnalysis(paperId: string) {
  try {
    // 解析ステータスを「処理中」に更新
    await firestore.collection('papers').doc(paperId).update({
      processingStatus: 'processing',
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    // 実際のアプリケーションではここでVertex AIによる処理を実行
    // 処理が完了したら「completed」に更新
    
    // 模擬的に少し待機してから「completed」に更新
    setTimeout(async () => {
      await firestore.collection('papers').doc(paperId).update({
        processingStatus: 'completed',
        updatedAt: firestore.FieldValue.serverTimestamp(),
        // 解析結果（実際にはVertex AIからの応答が入ります）
        aiAnalysis: {
          summary: '論文の要約（実際にはVertex AIから生成されます）',
          keypoints: ['キーポイント1', 'キーポイント2', 'キーポイント3'],
          significance: '研究の意義（実際にはVertex AIから生成されます）',
          relatedTopics: ['関連トピック1', '関連トピック2'],
          academicField: '学術分野',
          technicalLevel: 'intermediate',
          aiConfidenceScore: 85
        }
      });
    }, 10000); // 10秒後に完了（デモ用）
    
  } catch (error) {
    console.error('Paper analysis trigger error:', error);
    
    // エラー処理
    try {
      await firestore.collection('papers').doc(paperId).update({
        processingStatus: 'failed',
        errorLogs: firestore.FieldValue.arrayUnion({
          timestamp: firestore.FieldValue.serverTimestamp(),
          message: 'Analysis failed',
          code: 'ANALYSIS_FAILURE'
        }),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      console.error('Failed to update paper status:', updateError);
    }
  }
}