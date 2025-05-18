/**
 * 縦書きテキスト表示のためのユーティリティ関数
 */

// 縦書き用のスタイルオブジェクトを生成する
export function getVerticalWritingStyles(options?: {
  height?: string;
  maxHeight?: string;
  fontSize?: string;
  lineHeight?: number | string;
  backgroundColor?: string;
}) {
  return {
    writingMode: 'vertical-rl' as const,
    textOrientation: 'mixed' as const,
    overflowX: 'auto' as const,
    height: options?.height || '500px',
    maxHeight: options?.maxHeight,
    fontSize: options?.fontSize || 'inherit',
    lineHeight: options?.lineHeight || 1.8,
    backgroundColor: options?.backgroundColor || 'transparent',
    // 横スクロールのみを有効にする
    overflowY: 'hidden' as const,
    // マージンで縦書きの余白を調整
    marginRight: '20px',
    marginLeft: '20px',
    // 日本語テキストの禁則処理など
    textAlign: 'justify' as const,
  };
}

// 横書き用のスタイルオブジェクトを生成する
export function getHorizontalWritingStyles(options?: {
  height?: string;
  maxHeight?: string;
  fontSize?: string;
  lineHeight?: number | string;
  backgroundColor?: string;
}) {
  return {
    writingMode: 'horizontal-tb' as const,
    overflowY: 'auto' as const,
    height: options?.height || 'auto',
    maxHeight: options?.maxHeight || '500px',
    fontSize: options?.fontSize || 'inherit',
    lineHeight: options?.lineHeight || 1.8,
    backgroundColor: options?.backgroundColor || 'transparent',
    padding: '10px',
    // 日本語テキストの禁則処理など
    textAlign: 'justify' as const,
  };
}

// 縦書きに適したフォント指定を返す
export function getVerticalTextFontFamily() {
  return [
    '"Yu Mincho"', 
    '"YuMincho"', 
    '"Hiragino Mincho ProN"', 
    '"HGS明朝E"', 
    '"MS PMincho"', 
    'serif'
  ].join(',');
}

// 新聞スタイルの縦書きクラス名を返す
export const newspaperVerticalClass = `
  .newspaper-vertical-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    overflow-x: auto;
    overflow-y: hidden;
    height: 600px;
    line-height: 1.8;
    text-align: justify;
    padding: 0 1rem;
    font-family: "Yu Mincho", YuMincho, "Hiragino Mincho ProN", serif;
  }
  
  .newspaper-vertical-text p {
    margin: 0 1em;
  }
  
  .newspaper-vertical-text h2 {
    margin: 0 0.5em;
  }
`;

// 縦書きで表示する際に特別な処理が必要な文字の置換
export function adjustTextForVerticalWriting(text: string): string {
  return text
    // 横書き用の括弧を縦書き用に変換
    .replace(/\(/g, '︵')
    .replace(/\)/g, '︶')
    .replace(/\[/g, '﹇')
    .replace(/\]/g, '﹈')
    .replace(/\{/g, '︷')
    .replace(/\}/g, '︸')
    // 縦書きでの約物の向きを調整
    .replace(/:/g, '︓')
    .replace(/;/g, '︔')
    .replace(/!/g, '︕')
    .replace(/\?/g, '︖')
    // アルファベットを正立させる（オプション）
    // ここでは実装していないが、必要に応じて <span style="text-orientation: upright;">ABC</span> のように
    // 包むことでアルファベットを正立させることができる
    ;
}

// MUIコンポーネント用のカスタムスタイル - 新聞風の縦書きテキストフィールド
export const verticalNewspaperTextFieldStyle = {
  '& .MuiInputBase-root': {
    fontFamily: getVerticalTextFontFamily(),
    border: '1px solid #e0e0e0',
  },
  '& .MuiInputBase-input': {
    ...getVerticalWritingStyles({
      height: '300px',
      backgroundColor: '#fcfcf7'
    }),
    padding: '20px 10px',
    borderRadius: '4px',
  },
  '& .MuiFormLabel-root': {
    marginRight: '10px',
  }
};

// 新聞スタイルでのプレビュー用CSS生成
export function generateNewspaperCss({
  fontFamily = '"Yu Mincho", YuMincho, serif',
  primaryColor = '#000000',
  backgroundColor = '#ffffff',
  accentColor = '#f5f5f5',
  secondaryColor = '#444444',
}: {
  fontFamily?: string;
  primaryColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  secondaryColor?: string;
}) {
  return `
    body {
      font-family: ${fontFamily};
      color: ${primaryColor};
      background-color: ${backgroundColor};
      margin: 0;
      padding: 0;
    }
    
    .newspaper-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      box-sizing: border-box;
    }
    
    .newspaper-header {
      padding: 10px 0;
      border-bottom: 3px solid ${primaryColor};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .newspaper-title {
      font-size: 36px;
      font-weight: bold;
    }
    
    .newspaper-info {
      font-size: 14px;
    }
    
    .main-headline {
      font-size: 32px;
      font-weight: bold;
      margin: 20px 0 10px;
    }
    
    .sub-headline {
      font-size: 24px;
      margin: 10px 0;
    }
    
    .main-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    
    .main-article {
      writing-mode: vertical-rl;
      height: 600px;
      overflow-x: auto;
      overflow-y: hidden;
      line-height: 1.8;
      text-align: justify;
    }
    
    .horizontal-article {
      writing-mode: horizontal-tb;
      overflow-y: auto;
      max-height: 600px;
      line-height: 1.8;
      text-align: justify;
    }
    
    .sidebar {
      padding: 10px;
      background-color: ${accentColor};
      border-left: 1px solid ${secondaryColor};
    }
    
    .sub-article {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid ${secondaryColor};
    }
    
    .sub-article-headline {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .sub-article-content {
      writing-mode: vertical-rl;
      height: 200px;
      overflow-x: auto;
      overflow-y: hidden;
      line-height: 1.6;
    }
    
    .horizontal-sub-article-content {
      writing-mode: horizontal-tb;
      max-height: 200px;
      overflow-y: auto;
      line-height: 1.6;
    }
    
    .sidebar-content {
      padding: 10px;
      background-color: ${backgroundColor};
      border: 1px solid ${secondaryColor};
      margin-top: 20px;
    }
    
    .newspaper-footer {
      padding: 10px 0;
      border-top: 2px solid ${primaryColor};
      font-size: 12px;
      margin-top: 20px;
    }
    
    img {
      max-width: 100%;
    }
  `;
}