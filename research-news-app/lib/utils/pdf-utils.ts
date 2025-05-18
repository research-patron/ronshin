import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/firebase';

/**
 * 新聞をPDFとして出力するためのサーバーサイドユーティリティ関数
 */

interface PdfGenerationOptions {
  title: string;
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'a4' | 'a3' | 'letter';
  margin?: number;
  compress?: boolean;
  quality?: number;
}

/**
 * HTMLコンテンツからPDFを生成してFirebase Storageにアップロードする
 * 
 * @param htmlContent - 変換するHTMLコンテンツ（文字列）
 * @param newspaperId - 新聞ID
 * @param options - PDF生成オプション
 * @returns アップロードされたPDFのURL
 */
export async function generateAndUploadPdf(
  htmlContent: string,
  newspaperId: string,
  options: PdfGenerationOptions
): Promise<string> {
  try {
    // PDF生成処理（実際の実装では、サーバーサイドでのPDF生成ライブラリを使用）
    // この例では簡易的な実装
    
    // PDFのバイナリデータを生成（実際には適切なライブラリを使用）
    const pdfDoc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.paperSize || 'a4',
    });
    
    // HTMLコンテンツからPDFを生成
    pdfDoc.html(htmlContent, {
      callback: (pdf) => {
        // PDFが生成された後のコールバック処理
        console.log('PDF generated successfully');
      },
      x: options.margin || 10,
      y: options.margin || 10,
      width: pdfDoc.internal.pageSize.getWidth() - (options.margin || 10) * 2,
      windowWidth: 1200, // 想定する画面幅
    });
    
    // PDFをFirebase Storageにアップロード
    const pdfBytes = pdfDoc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // アップロード先のパスを設定
    const fileName = options.fileName || `newspaper_${newspaperId}_${Date.now()}.pdf`;
    const storagePath = `newspapers/${newspaperId}/exports/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    // PDFをアップロード
    await uploadBytes(storageRef, pdfBlob);
    
    // アップロードされたPDFのURLを取得
    const downloadUrl = await getDownloadURL(storageRef);
    
    return downloadUrl;
  } catch (error) {
    console.error('PDF generation and upload error:', error);
    throw new Error(`PDF生成とアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * PDFエクスポート情報を作成する
 * 
 * @param userId - ユーザーID
 * @param pdfUrl - PDFのURL
 * @returns エクスポート情報オブジェクト
 */
export function createPdfExportInfo(userId: string, pdfUrl: string) {
  return {
    type: 'pdf',
    format: 'a3',
    url: pdfUrl,
    createdBy: userId,
    createdAt: serverTimestamp(),
    fileSize: 0, // 実際のファイルサイズは不明なので0を設定
  };
}