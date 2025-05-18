/**
 * 日本語の縦書きテキスト表示をサポートするユーティリティ関数群
 */

/**
 * 縦書きスタイルを適用するCSS
 */
export function applyVerticalWritingStyles(style: any) {
  // テキスト方向に基づいてスタイルを設定
  const direction = style.textDirection || 'vertical-rl';
  
  if (direction === 'horizontal-tb') {
    return {}; // 横書きの場合は特別なスタイルを適用しない
  }
  
  // 縦書き用のスタイル
  return {
    writingMode: direction,
    textOrientation: 'upright', // 全ての文字を正立させる
    height: '80vh', // 高さを固定
    maxHeight: '1000px',
    overflow: 'auto',
    // 横スクロールに対応
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '2rem',
    paddingTop: '3rem',
    
    // 以下は縦書き特有のスタイル調整
    // アルファベットを縦に配置
    '.latin-text': {
      textOrientation: 'mixed',
    },
    
    // 縦中横（数字などを横に表示）のスタイル
    '.tcy': {
      textCombineUpright: 'all',
      textOrientation: 'mixed',
    },
  };
}

/**
 * テキスト方向に基づいたCSSクラス名を取得
 */
export function getTextDirectionClass(direction: string) {
  switch (direction) {
    case 'vertical-rl':
      return 'vertical-rl';
    case 'vertical-lr':
      return 'vertical-lr';
    default:
      return 'horizontal-tb';
  }
}

/**
 * 縦書きテキスト用のグローバルCSSを生成
 */
export const verticalTextGlobalStyles = `
  .vertical-rl {
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }
  
  .vertical-lr {
    writing-mode: vertical-lr;
    text-orientation: mixed;
  }
  
  .horizontal-tb {
    writing-mode: horizontal-tb;
  }
  
  .tcy {
    text-combine-upright: all;
  }
  
  /* 句読点のぶら下げ */
  .vertical-rl .burasage,
  .vertical-lr .burasage {
    text-indent: -1em;
    padding-top: 1em;
  }
  
  /* 縦書きの場合、画像を90度回転 */
  .vertical-rl img, .vertical-lr img {
    transform: rotate(90deg);
    max-height: 200px;
    display: inline-block;
    margin: 1em 0;
  }
`;

/**
 * 数字や英数字を縦中横（横向きに表示）で表示するように変換
 */
export function formatTextForVerticalWriting(text: string) {
  if (!text) return '';
  
  // 数字のパターン（1〜4桁の数字を縦中横に）
  const numberPattern = /([0-9]{1,4})/g;
  
  // アルファベットの短い単語パターン
  const shortAlphaPattern = /([a-zA-Z]{1,4})/g;
  
  // 縦中横用のタグで囲む
  return text
    .replace(numberPattern, '<span class="tcy">$1</span>')
    .replace(shortAlphaPattern, '<span class="latin-text">$1</span>');
}

/**
 * 句読点のぶら下げを適用
 */
export function applyPunctuationHanging(text: string) {
  if (!text) return '';
  
  // 句読点パターン（。、．，！？）
  const punctuationPattern = /([。、．，！？])/g;
  
  // ぶら下げ用のタグで囲む
  return text.replace(punctuationPattern, '<span class="burasage">$1</span>');
}