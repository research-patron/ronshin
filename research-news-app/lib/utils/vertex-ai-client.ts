/**
 * フロントエンド用のVertex AI クライアント実装
 * Firebaseの関数経由でVertex AIを呼び出し、PDFの解析や新聞記事の生成を行う
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/firebase';

// Firebase Cloud Functions のインスタンス
const functions = getFunctions(app);

/**
 * 論文ID、テンプレートIDを指定して新聞記事を生成する
 * @param paperId 論文ID
 * @param templateId テンプレートID
 * @returns 生成された新聞記事情報
 */
export async function generateNewspaper(paperId: string, templateId: string) {
  try {
    const createNewspaperFunction = httpsCallable(functions, 'createNewspaper');
    const result = await createNewspaperFunction({ paperId, templateId });
    return result.data as { id: string; content: any };
  } catch (error: any) {
    console.error('Error generating newspaper:', error);
    throw new Error(error.message || '新聞記事の生成に失敗しました');
  }
}

/**
 * 記事の内容から最適な見出しを生成する
 * @param content 記事の内容
 * @returns 生成された見出し（メイン見出しとサブ見出し）
 */
export async function generateHeadline(content: string) {
  try {
    const optimizeHeadlineFunction = httpsCallable(functions, 'optimizeHeadline');
    const result = await optimizeHeadlineFunction({ content });
    return result.data as { main: string; sub: string };
  } catch (error: any) {
    console.error('Error generating headline:', error);
    throw new Error(error.message || '見出しの生成に失敗しました');
  }
}

/**
 * 論文解析のステータスを確認する
 * @param paperId 論文ID
 * @returns 解析ステータス（pending, processing, completed, failed）
 */
export async function checkPaperAnalysisStatus(paperId: string) {
  try {
    const checkStatusFunction = httpsCallable(functions, 'checkPaperAnalysisStatus');
    const result = await checkStatusFunction({ paperId });
    return result.data as { status: string; progress?: number; error?: string };
  } catch (error: any) {
    console.error('Error checking paper analysis status:', error);
    throw new Error(error.message || '解析ステータスの確認に失敗しました');
  }
}