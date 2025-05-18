import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';

/**
 * 新聞をPDFとして出力するための各種ユーティリティ関数
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
 * HTML要素をPDFに変換して保存する
 * 
 * @param element - 変換するHTML要素
 * @param options - PDF生成オプション
 * @returns 生成されたPDFのBlob URLまたはエラーメッセージ
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: PdfGenerationOptions
): Promise<string> {
  try {
    // デフォルトファイル名の設定
    const fileName = options.fileName || `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    // 印刷前にスクロールを非表示にして、要素の高さを正確に取得
    const originalStyle = element.style.cssText;
    element.style.overflow = 'hidden';
    
    // 紙のサイズの設定
    let paperWidth = 210; // A4 width in mm
    let paperHeight = 297; // A4 height in mm
    
    if (options.paperSize === 'a3') {
      paperWidth = 297;
      paperHeight = 420;
    } else if (options.paperSize === 'letter') {
      paperWidth = 216;
      paperHeight = 279;
    }
    
    // 向きの設定（横向きの場合は幅と高さを入れ替え）
    if (options.orientation === 'landscape') {
      [paperWidth, paperHeight] = [paperHeight, paperWidth];
    }
    
    // 要素をキャンバスに変換（高品質な画像として取得）
    const canvas = await html2canvas(element, {
      scale: 2, // 高解像度
      useCORS: true, // Cross-Origin画像のロードを許可
      allowTaint: true, // CORS以外の画像もロード
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
    
    // キャンバスから画像データを取得
    const imgData = canvas.toDataURL('image/jpeg', options.quality || 0.95);
    
    // 要素の元のスタイルを復元
    element.style.cssText = originalStyle;
    
    // PDF生成
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.paperSize || 'a4',
      compress: options.compress !== false,
    });
    
    // 画像のアスペクト比を計算
    const imgWidth = paperWidth - (options.margin || 10) * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // PDFに画像を追加
    pdf.addImage(imgData, 'JPEG', options.margin || 10, options.margin || 10, imgWidth, imgHeight);
    
    // 複数ページに分割する必要がある場合
    let position = imgHeight + (options.margin || 10) * 2;
    let pageHeight = pdf.internal.pageSize.height - (options.margin || 10) * 2;
    
    // 実際のコンテンツが複数ページになる場合に新規ページを追加
    while (position < canvas.height) {
      pdf.addPage();
      pdf.addImage(
        imgData,
        'JPEG',
        options.margin || 10,
        -(position - (options.margin || 10)),
        imgWidth,
        imgHeight
      );
      position += pageHeight;
    }
    
    // PDFをBlob形式で保存
    const pdfBlob = pdf.output('blob');
    
    // Blob URLを生成して返す
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error('PDF generation error:', error);
    return `PDF生成中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`;
  }
}

/**
 * PDF生成用のHTMLを最適化する
 * 縦書きや特殊なレイアウトを保持するためのラップ関数
 * 
 * @param element - 最適化するHTML要素
 * @returns 最適化済みのHTML要素
 */
export function optimizeElementForPdf(element: HTMLElement): HTMLElement {
  // 元の要素の複製を作成
  const optimizedElement = element.cloneNode(true) as HTMLElement;
  
  // スクロールバーやポインターイベントを無効化
  optimizedElement.style.overflow = 'hidden';
  optimizedElement.style.pointerEvents = 'none';
  
  // 縦書きテキストのスタイルを維持するための調整
  const verticalElements = optimizedElement.querySelectorAll('.vertical-rl, .vertical-lr');
  verticalElements.forEach((el) => {
    const elem = el as HTMLElement;
    // 縦書きスタイルを強制
    elem.style.writingMode = elem.className.includes('vertical-rl') ? 'vertical-rl' : 'vertical-lr';
    elem.style.textOrientation = 'upright';
  });
  
  return optimizedElement;
}

/**
 * PDF生成用に新聞要素をキャプチャして画像として保存
 * 
 * @param element - キャプチャするHTML要素
 * @param options - キャプチャオプション
 * @returns 生成された画像のデータURL
 */
export async function captureElementAsImage(
  element: HTMLElement,
  options: { quality?: number; type?: 'png' | 'jpeg' } = {}
): Promise<string> {
  try {
    const dataUrl = await toPng(element, {
      quality: options.quality || 0.95,
      canvasWidth: element.scrollWidth * 2,
      canvasHeight: element.scrollHeight * 2,
      pixelRatio: 2,
    });
    
    return dataUrl;
  } catch (error) {
    console.error('Image capture error:', error);
    throw new Error(`画像キャプチャに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * 生成されたPDFをダウンロードする
 * 
 * @param blobUrl - PDFのBlob URL
 * @param fileName - ダウンロードするファイル名
 */
export function downloadPdf(blobUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Blob URLのクリーンアップ（メモリリーク防止）
  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
}