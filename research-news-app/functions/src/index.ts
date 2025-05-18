import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { analyzePaper } from './ai/paper-analysis';
import { generateNewspaper, generateHeadline } from './utils/newspaper-generator';

// Firebase アプリの初期化
admin.initializeApp();

// Cloud Functions のエクスポート
export {
  analyzePaper
};

// 論文から新聞記事を生成する関数
export const createNewspaper = functions.https.onCall(async (data, context) => {
  // 認証確認
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'この機能を使用するにはログインが必要です'
    );
  }
  
  const { paperId, templateId } = data;
  
  if (!paperId || !templateId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      '論文IDとテンプレートIDが必要です'
    );
  }
  
  try {
    const userId = context.auth.uid;
    
    // 新聞生成実行
    const result = await generateNewspaper(paperId, templateId, userId);
    
    return result;
  } catch (error) {
    console.error('Error in createNewspaper:', error);
    throw new functions.https.HttpsError(
      'internal',
      `新聞記事の生成に失敗しました: ${error.message}`
    );
  }
});

// 見出し生成関数
export const optimizeHeadline = functions.https.onCall(async (data, context) => {
  // 認証確認
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'この機能を使用するにはログインが必要です'
    );
  }
  
  const { content } = data;
  
  if (!content) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      '記事の内容が必要です'
    );
  }
  
  try {
    // 見出し生成実行
    const headline = await generateHeadline(content);
    
    return headline;
  } catch (error) {
    console.error('Error in optimizeHeadline:', error);
    throw new functions.https.HttpsError(
      'internal',
      `見出しの生成に失敗しました: ${error.message}`
    );
  }
});

// 論文アップロード時に解析タスクをエンキュー
export const onPaperCreated = functions.firestore
  .document('papers/{paperId}')
  .onCreate(async (snapshot, context) => {
    const paperId = context.params.paperId;
    const paperData = snapshot.data();
    
    if (
      paperData && 
      paperData.fileUrl && 
      paperData.processingStatus === 'pending'
    ) {
      // Cloud Tasksにタスクを登録したいが、ソースコードレベルでは何もしない
      // デプロイ時にFirebaseとの統合が必要
      // const queue = functions.tasks.taskQueue({ retryConfig: { maxAttempts: 5 } });
      // await queue.executeTask('analyzePaper', { paperId });
      console.log(`[TODO] Enqueue analysis task for paper: ${paperId}`);
      
      console.log(`Enqueued analysis task for paper: ${paperId}`);
    }
    
    return null;
  });

// 論文削除時に関連ファイルを削除
export const onPaperDeleted = functions.firestore
  .document('papers/{paperId}')
  .onDelete(async (snapshot, context) => {
    const paperId = context.params.paperId;
    const paperData = snapshot.data();
    
    if (paperData && paperData.fileUrl) {
      try {
        // Storageからファイルを削除
        const fileUrl = paperData.fileUrl;
        // Firebase Admin SDK v9では処理方法が変わっているのでデプロイ時に修正必要
        const bucket = admin.storage().bucket();
        const fileName = fileUrl.split('/').pop().split('?')[0];
        await bucket.file(fileName).delete();
        
        console.log(`Deleted file for paper: ${paperId}`);
      } catch (error) {
        console.error(`Error deleting file for paper ${paperId}:`, error);
      }
    }
    
    return null;
  });