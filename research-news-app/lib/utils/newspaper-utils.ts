// 新聞関連のユーティリティ関数

// 新聞コンテンツの型定義
export interface NewspaperContent {
  header: {
    newspaperName: string;
    date: string;
    issueNumber: string;
  };
  mainArticle: {
    headline: string;
    subheadline?: string;
    content: string;
    imageUrl?: string;
    paperIds: string[];
  };
  subArticles: {
    headline: string;
    content: string;
    imageUrl?: string;
    paperId: string;
  }[];
  sidebarContent?: string;
  columnContent?: string;
  adContent?: string;
  footer: string;
}

// 新聞の共有設定の型定義
export interface NewspaperShareSettings {
  type: 'private' | 'group' | 'public';
  groupIds: string[];
  viewCount: number;
  shareUrl?: string;
}

// 新聞のカスタム設定の型定義
export interface NewspaperCustomSettings {
  fontFamily: string;
  colorScheme: string;
  logoUrl?: string;
}

// 新聞全体の型定義
export interface Newspaper {
  id: string;
  creatorId: string;
  title: string;
  templateId: string;
  isPublic: boolean;
  shareSettings: NewspaperShareSettings;
  content: NewspaperContent;
  customSettings: NewspaperCustomSettings;
  exportHistory?: {
    type: string;
    url: string;
    createdAt: any;
  }[];
  createdAt: any;
  updatedAt: any;
}

// 利用可能なフォントファミリー
export const availableFonts = [
  { id: 'default', name: 'デフォルト', 
    value: '"游明朝", "Yu Mincho", YuMincho, serif', 
    description: '標準的な明朝体フォント' },
  { id: 'gothic', name: 'ゴシック',
    value: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
    description: '現代的なゴシック体フォント' },
  { id: 'meiryo', name: 'メイリオ',
    value: '"Meiryo", "メイリオ", sans-serif',
    description: '可読性に優れたUIフォント' },
  { id: 'noto', name: '源ノ明朝',
    value: '"Noto Serif JP", serif',
    description: '高品質な日本語明朝体フォント' },
  { id: 'noto-sans', name: '源ノ角ゴシック',
    value: '"Noto Sans JP", sans-serif',
    description: '高品質なサンセリフフォント' },
  { id: 'custom', name: 'カスタム',
    value: 'custom',
    description: 'カスタムフォント (プレミアム会員のみ)' }
];

// 利用可能なカラースキーム
export const availableColorSchemes = [
  { id: 'default', name: 'クラシック',
    colors: { primary: '#000000', secondary: '#444444', background: '#ffffff', accent: '#f5f5f5' },
    description: '伝統的な新聞のモノクロ配色' },
  { id: 'sepia', name: 'セピア',
    colors: { primary: '#704214', secondary: '#8a6642', background: '#f8f0e3', accent: '#eee0c9' },
    description: 'クラシカルな温かみのある配色' },
  { id: 'modern', name: 'モダン',
    colors: { primary: '#1a237e', secondary: '#283593', background: '#ffffff', accent: '#e8eaf6' },
    description: '現代的なブルーベースの配色' },
  { id: 'business', name: 'ビジネス',
    colors: { primary: '#2e7d32', secondary: '#388e3c', background: '#ffffff', accent: '#e8f5e9' },
    description: 'ビジネス向けの信頼感のある配色' },
  { id: 'academic', name: 'アカデミック',
    colors: { primary: '#004d40', secondary: '#00695c', background: '#ffffff', accent: '#e0f2f1' },
    description: '学術的な印象の配色' },
  { id: 'custom', name: 'カスタム',
    colors: { primary: '#000000', secondary: '#444444', background: '#ffffff', accent: '#f5f5f5' },
    description: 'カスタム配色 (プレミアム会員のみ)' }
];

// デフォルトの新聞コンテンツを生成
export function createDefaultNewspaperContent(): NewspaperContent {
  const today = new Date();
  const dateStr = today.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  
  return {
    header: {
      newspaperName: '学術新聞',
      date: dateStr,
      issueNumber: `第${Math.floor(Math.random() * 1000) + 1}号`
    },
    mainArticle: {
      headline: '新聞見出し',
      subheadline: 'サブ見出し',
      content: '本文をここに入力してください。',
      paperIds: []
    },
    subArticles: [
      {
        headline: 'サブ記事見出し',
        content: 'サブ記事の本文をここに入力してください。',
        paperId: ''
      }
    ],
    sidebarContent: 'サイドバーの内容をここに入力してください。',
    footer: `© ${today.getFullYear()} Research News Network. 本紙は学術論文を基に生成されたものです。`
  };
}

// 新聞エディタのHTML生成
export function generateNewspaperHTML(
  newspaper: Newspaper,
  customSettings: NewspaperCustomSettings = { fontFamily: 'default', colorScheme: 'default' }
): string {
  const fontFamily = getFontFamily(customSettings.fontFamily);
  const colorScheme = getColorScheme(customSettings.colorScheme);
  
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${newspaper.title || '無題の新聞'}</title>
      <style>
        body {
          font-family: ${fontFamily};
          color: ${colorScheme.colors.primary};
          background-color: ${colorScheme.colors.background};
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
          border-bottom: 3px solid ${colorScheme.colors.primary};
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
          line-height: 1.8;
          text-align: justify;
        }
        
        .sidebar {
          padding: 10px;
          background-color: ${colorScheme.colors.accent};
          border-left: 1px solid ${colorScheme.colors.secondary};
        }
        
        .sub-article {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid ${colorScheme.colors.secondary};
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
          line-height: 1.6;
        }
        
        .sidebar-content {
          padding: 10px;
          background-color: ${colorScheme.colors.background};
          border: 1px solid ${colorScheme.colors.secondary};
          margin-top: 20px;
        }
        
        .newspaper-footer {
          padding: 10px 0;
          border-top: 2px solid ${colorScheme.colors.primary};
          font-size: 12px;
          margin-top: 20px;
        }
        
        img {
          max-width: 100%;
        }
      </style>
    </head>
    <body>
      <div class="newspaper-container">
        <header class="newspaper-header">
          <div class="newspaper-title">${newspaper.content.header.newspaperName}</div>
          <div class="newspaper-info">
            ${newspaper.content.header.date} ${newspaper.content.header.issueNumber}
          </div>
        </header>
        
        <h1 class="main-headline">${newspaper.content.mainArticle.headline}</h1>
        ${newspaper.content.mainArticle.subheadline ? `<h2 class="sub-headline">${newspaper.content.mainArticle.subheadline}</h2>` : ''}
        
        <div class="main-content">
          <div>
            ${newspaper.content.mainArticle.imageUrl ? `<img src="${newspaper.content.mainArticle.imageUrl}" alt="Main article illustration">` : ''}
            <div class="main-article">${newspaper.content.mainArticle.content}</div>
          </div>
          
          <div class="sidebar">
            ${newspaper.content.subArticles.map(subArticle => `
              <div class="sub-article">
                <h3 class="sub-article-headline">${subArticle.headline}</h3>
                ${subArticle.imageUrl ? `<img src="${subArticle.imageUrl}" alt="Sub article illustration">` : ''}
                <div class="sub-article-content">${subArticle.content}</div>
              </div>
            `).join('')}
            
            <div class="sidebar-content">
              ${newspaper.content.sidebarContent || ''}
            </div>
          </div>
        </div>
        
        <footer class="newspaper-footer">
          ${newspaper.content.footer}
        </footer>
      </div>
    </body>
    </html>
  `;
}

// フォントファミリーの取得
function getFontFamily(fontId: string): string {
  const font = availableFonts.find(f => f.id === fontId);
  return font ? font.value : availableFonts[0].value;
}

// カラースキームの取得
function getColorScheme(schemeId: string): any {
  const scheme = availableColorSchemes.find(s => s.id === schemeId);
  return scheme || availableColorSchemes[0];
}

// HTMLからプレーンテキストを抽出
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // HTMLタグを削除
    .replace(/&nbsp;/g, ' ') // &nbsp;を通常の空白に変換
    .replace(/&lt;/g, '<') // &lt;を<に変換
    .replace(/&gt;/g, '>') // &gt;を>に変換
    .replace(/&amp;/g, '&') // &amp;を&に変換
    .replace(/&quot;/g, '"') // &quot;を"に変換
    .replace(/&apos;/g, "'") // &apos;を'に変換
    .trim(); // 前後の空白を削除
}

// プレーンテキストをHTMLエスケープ
export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 指定した長さで文字列を省略
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}