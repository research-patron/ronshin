// 新聞テンプレートの型定義
export interface TemplateComponent {
  type: string;
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  styles: Record<string, any>;
  content?: Record<string, any>;
}

export interface NewspaperTemplate {
  id: string;
  name: string;
  description: string;
  previewImageUrl: string;
  isPremium: boolean;
  category: 'standard' | 'academic' | 'magazine' | 'tabloid';
  layout: {
    version: string;
    components: TemplateComponent[];
  };
  compatibleLanguages: string[];
  usageCount: number;
  createdAt: any;
  updatedAt: any;
}

// 標準テンプレート
export const standardTemplate: NewspaperTemplate = {
  id: "standard",
  name: "スタンダード",
  description: "伝統的な活字新聞風デザイン",
  previewImageUrl: "/templates/standard.png",
  isPremium: false,
  category: "standard",
  layout: {
    version: "1.0",
    components: [
      {
        type: "header",
        id: "newspaper-header",
        position: { x: 0, y: 0 },
        size: { width: 100, height: 10 },
        styles: {
          borderBottom: "2px solid #000",
          fontFamily: "'游明朝', YuMincho, serif"
        }
      },
      {
        type: "headline",
        id: "main-headline",
        position: { x: 0, y: 10 },
        size: { width: 70, height: 10 },
        styles: {
          fontSize: "28px",
          fontWeight: "bold",
          borderBottom: "1px solid #000"
        }
      },
      {
        type: "textContent",
        id: "main-article",
        position: { x: 0, y: 20 },
        size: { width: 70, height: 50 },
        styles: {
          writingMode: "vertical-rl",
          fontFamily: "'游明朝', YuMincho, serif",
          fontSize: "16px",
          lineHeight: 1.8,
          height: "500px"
        }
      },
      {
        type: "sidebar",
        id: "right-sidebar",
        position: { x: 70, y: 10 },
        size: { width: 30, height: 60 },
        styles: {
          writingMode: "vertical-rl",
          fontFamily: "'游明朝', YuMincho, serif",
          fontSize: "14px",
          borderLeft: "1px solid #000"
        }
      },
      {
        type: "image",
        id: "main-image",
        position: { x: 40, y: 25 },
        size: { width: 30, height: 20 },
        styles: {
          border: "1px solid #000"
        }
      },
      {
        type: "footer",
        id: "newspaper-footer",
        position: { x: 0, y: 90 },
        size: { width: 100, height: 10 },
        styles: {
          borderTop: "1px solid #000",
          fontFamily: "'游明朝', YuMincho, serif",
          fontSize: "12px"
        }
      }
    ]
  },
  compatibleLanguages: ["ja", "en"],
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// クラシックテンプレート
export const classicTemplate: NewspaperTemplate = {
  id: "classic",
  name: "クラシック",
  description: "伝統的な日本の新聞スタイル",
  previewImageUrl: "/templates/classic.png",
  isPremium: false,
  category: "standard",
  layout: {
    version: "1.0",
    components: [
      {
        type: "header",
        id: "newspaper-header",
        position: { x: 0, y: 0 },
        size: { width: 100, height: 8 },
        styles: {
          borderBottom: "3px solid #000",
          fontFamily: "'游明朝', YuMincho, serif",
          backgroundColor: "#f9f9f9"
        }
      },
      {
        type: "headline",
        id: "main-headline",
        position: { x: 65, y: 8 },
        size: { width: 35, height: 10 },
        styles: {
          fontSize: "30px",
          fontWeight: "bold",
          writingMode: "vertical-rl"
        }
      },
      {
        type: "textContent",
        id: "main-article",
        position: { x: 55, y: 18 },
        size: { width: 45, height: 60 },
        styles: {
          writingMode: "vertical-rl",
          fontFamily: "'游明朝', YuMincho, serif",
          fontSize: "16px",
          lineHeight: 1.8
        }
      },
      {
        type: "subheadline",
        id: "sub-headline-1",
        position: { x: 45, y: 8 },
        size: { width: 20, height: 8 },
        styles: {
          fontSize: "22px",
          fontWeight: "bold",
          writingMode: "vertical-rl"
        }
      },
      {
        type: "textContent",
        id: "sub-article-1",
        position: { x: 25, y: 8 },
        size: { width: 20, height: 50 },
        styles: {
          writingMode: "vertical-rl",
          fontFamily: "'游明朝', YuMincho, serif",
          fontSize: "14px",
          lineHeight: 1.8
        }
      },
      {
        type: "image",
        id: "main-image",
        position: { x: 0, y: 8 },
        size: { width: 25, height: 20 },
        styles: {
          border: "1px solid #000"
        }
      },
      {
        type: "subheadline",
        id: "sub-headline-2",
        position: { x: 0, y: 30 },
        size: { width: 20, height: 8 },
        styles: {
          fontSize: "20px",
          fontWeight: "bold",
          writingMode: "vertical-rl"
        }
      },
      {
        type: "textContent",
        id: "sub-article-2",
        position: { x: 0, y: 38 },
        size: { width: 25, height: 50 },
        styles: {
          writingMode: "vertical-rl",
          fontFamily: "'游明朝', YuMincho, serif",
          fontSize: "14px",
          lineHeight: 1.8
        }
      },
      {
        type: "footer",
        id: "newspaper-footer",
        position: { x: 0, y: 92 },
        size: { width: 100, height: 8 },
        styles: {
          borderTop: "2px solid #000",
          fontFamily: "'游明朝', YuMincho, serif",
          fontSize: "12px",
          backgroundColor: "#f9f9f9"
        }
      }
    ]
  },
  compatibleLanguages: ["ja"],
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// モダンテンプレート
export const modernTemplate: NewspaperTemplate = {
  id: "modern",
  name: "モダン",
  description: "現代的でクリーンなデザイン",
  previewImageUrl: "/templates/modern.png",
  isPremium: false,
  category: "magazine",
  layout: {
    version: "1.0",
    components: [
      {
        type: "header",
        id: "newspaper-header",
        position: { x: 0, y: 0 },
        size: { width: 100, height: 10 },
        styles: {
          borderBottom: "1px solid #ddd",
          fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif",
          backgroundColor: "#fff"
        }
      },
      {
        type: "headline",
        id: "main-headline",
        position: { x: 0, y: 10 },
        size: { width: 100, height: 15 },
        styles: {
          fontSize: "32px",
          fontWeight: "bold",
          fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif",
          textAlign: "center",
          paddingBottom: "10px",
          borderBottom: "1px solid #ddd"
        }
      },
      {
        type: "image",
        id: "main-image",
        position: { x: 0, y: 25 },
        size: { width: 100, height: 30 },
        styles: {}
      },
      {
        type: "textContent",
        id: "main-article",
        position: { x: 0, y: 55 },
        size: { width: 65, height: 35 },
        styles: {
          fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif",
          fontSize: "16px",
          lineHeight: 1.8,
          textAlign: "justify"
        }
      },
      {
        type: "sidebar",
        id: "right-sidebar",
        position: { x: 65, y: 55 },
        size: { width: 35, height: 35 },
        styles: {
          fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif",
          fontSize: "14px",
          backgroundColor: "#f9f9f9",
          padding: "10px",
          borderLeft: "1px solid #ddd"
        }
      },
      {
        type: "footer",
        id: "newspaper-footer",
        position: { x: 0, y: 90 },
        size: { width: 100, height: 10 },
        styles: {
          borderTop: "1px solid #ddd",
          fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif",
          fontSize: "12px",
          backgroundColor: "#fff"
        }
      }
    ]
  },
  compatibleLanguages: ["ja", "en"],
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// 学術論文テンプレート (プレミアム)
export const academicTemplate: NewspaperTemplate = {
  id: "academic",
  name: "アカデミック",
  description: "学術論文向けの専門的なレイアウト",
  previewImageUrl: "/templates/academic.png",
  isPremium: true,
  category: "academic",
  layout: {
    version: "1.0",
    components: [
      {
        type: "header",
        id: "newspaper-header",
        position: { x: 0, y: 0 },
        size: { width: 100, height: 10 },
        styles: {
          borderBottom: "2px solid #1a237e",
          fontFamily: "'游明朝', YuMincho, serif",
          backgroundColor: "#e8eaf6"
        }
      },
      {
        type: "headline",
        id: "main-headline",
        position: { x: 0, y: 10 },
        size: { width: 100, height: 12 },
        styles: {
          fontSize: "30px",
          fontWeight: "bold",
          textAlign: "center",
          borderBottom: "1px solid #c5cae9",
          paddingBottom: "10px",
          color: "#1a237e"
        }
      },
      {
        type: "textContent",
        id: "abstract",
        position: { x: 5, y: 22 },
        size: { width: 90, height: 15 },
        styles: {
          fontFamily: "'游明朝', YuMincho, serif",
          fontSize: "16px",
          lineHeight: 1.6,
          padding: "10px",
          backgroundColor: "#f5f5f5",
          border: "1px solid #e0e0e0",
          borderRadius: "4px"
        }
      },
      {
        type: "columnContainer",
        id: "two-column-layout",
        position: { x: 0, y: 37 },
        size: { width: 100, height: 53 },
        styles: {
          display: "flex",
          gap: "20px"
        },
        content: {
          columns: 2
        }
      },
      {
        type: "image",
        id: "main-figure",
        position: { x: 20, y: 40 },
        size: { width: 60, height: 25 },
        styles: {
          border: "1px solid #c5cae9"
        }
      },
      {
        type: "footer",
        id: "newspaper-footer",
        position: { x: 0, y: 90 },
        size: { width: 100, height: 10 },
        styles: {
          borderTop: "2px solid #1a237e",
          fontFamily: "'游明朝', YuMincho, serif",
          fontSize: "12px",
          backgroundColor: "#e8eaf6",
          color: "#1a237e"
        }
      }
    ]
  },
  compatibleLanguages: ["ja", "en"],
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// タブロイド風テンプレート (プレミアム)
export const tabloidTemplate: NewspaperTemplate = {
  id: "tabloid",
  name: "タブロイド",
  description: "大胆な見出しと写真を使ったインパクトのあるレイアウト",
  previewImageUrl: "/templates/tabloid.png",
  isPremium: true,
  category: "tabloid",
  layout: {
    version: "1.0",
    components: [
      {
        type: "header",
        id: "newspaper-header",
        position: { x: 0, y: 0 },
        size: { width: 100, height: 12 },
        styles: {
          backgroundColor: "#d50000",
          color: "white",
          fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
          borderBottom: "5px solid #000"
        }
      },
      {
        type: "headline",
        id: "main-headline",
        position: { x: 0, y: 12 },
        size: { width: 100, height: 18 },
        styles: {
          fontSize: "48px",
          fontWeight: "bold",
          fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
          textAlign: "center",
          color: "#d50000",
          textTransform: "uppercase"
        }
      },
      {
        type: "image",
        id: "main-image",
        position: { x: 0, y: 30 },
        size: { width: 100, height: 40 },
        styles: {
          border: "5px solid #000"
        }
      },
      {
        type: "textContent",
        id: "main-article",
        position: { x: 0, y: 70 },
        size: { width: 100, height: 20 },
        styles: {
          fontFamily: "Arial, sans-serif",
          fontSize: "18px",
          lineHeight: 1.5,
          fontWeight: "bold",
          textAlign: "justify",
          padding: "10px",
          columnCount: 2,
          columnGap: "20px"
        }
      },
      {
        type: "footer",
        id: "newspaper-footer",
        position: { x: 0, y: 90 },
        size: { width: 100, height: 10 },
        styles: {
          backgroundColor: "#d50000",
          color: "white",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          borderTop: "5px solid #000"
        }
      }
    ]
  },
  compatibleLanguages: ["ja", "en"],
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// ビジネステンプレート (プレミアム)
export const businessTemplate: NewspaperTemplate = {
  id: "business",
  name: "ビジネス",
  description: "経済・財務情報に適した洗練されたレイアウト",
  previewImageUrl: "/templates/business.png",
  isPremium: true,
  category: "standard",
  layout: {
    version: "1.0",
    components: [
      {
        type: "header",
        id: "newspaper-header",
        position: { x: 0, y: 0 },
        size: { width: 100, height: 10 },
        styles: {
          backgroundColor: "#fff",
          borderBottom: "2px solid #2e7d32",
          fontFamily: "'Noto Sans JP', sans-serif"
        }
      },
      {
        type: "headline",
        id: "main-headline",
        position: { x: 0, y: 10 },
        size: { width: 70, height: 10 },
        styles: {
          fontSize: "32px",
          fontWeight: "bold",
          fontFamily: "'Noto Sans JP', sans-serif",
          color: "#2e7d32",
          borderBottom: "1px solid #c8e6c9"
        }
      },
      {
        type: "textContent",
        id: "main-article",
        position: { x: 0, y: 20 },
        size: { width: 65, height: 40 },
        styles: {
          fontFamily: "'Noto Sans JP', sans-serif",
          fontSize: "16px",
          lineHeight: 1.8,
          columnCount: 2,
          columnGap: "20px"
        }
      },
      {
        type: "sidebar",
        id: "market-summary",
        position: { x: 70, y: 10 },
        size: { width: 30, height: 40 },
        styles: {
          backgroundColor: "#f1f8e9",
          padding: "10px",
          border: "1px solid #c8e6c9",
          fontFamily: "'Noto Sans JP', sans-serif"
        }
      },
      {
        type: "image",
        id: "chart-image",
        position: { x: 0, y: 60 },
        size: { width: 50, height: 30 },
        styles: {
          border: "1px solid #e0e0e0"
        }
      },
      {
        type: "textContent",
        id: "analysis",
        position: { x: 50, y: 60 },
        size: { width: 50, height: 30 },
        styles: {
          fontFamily: "'Noto Sans JP', sans-serif",
          fontSize: "14px",
          lineHeight: 1.6,
          padding: "10px",
          backgroundColor: "#f9f9f9",
          border: "1px solid #e0e0e0"
        }
      },
      {
        type: "footer",
        id: "newspaper-footer",
        position: { x: 0, y: 90 },
        size: { width: 100, height: 10 },
        styles: {
          backgroundColor: "#fff",
          borderTop: "2px solid #2e7d32",
          fontFamily: "'Noto Sans JP', sans-serif",
          fontSize: "12px"
        }
      }
    ]
  },
  compatibleLanguages: ["ja", "en"],
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

// すべてのテンプレートをエクスポート
export const allTemplates = [
  standardTemplate,
  classicTemplate,
  modernTemplate,
  academicTemplate,
  tabloidTemplate,
  businessTemplate
];

// 無料テンプレートのみ
export const freeTemplates = allTemplates.filter(template => !template.isPremium);

// プレミアムテンプレートのみ
export const premiumTemplates = allTemplates.filter(template => template.isPremium);

// テンプレートの取得（IDベース）
export function getTemplateById(id: string): NewspaperTemplate | undefined {
  return allTemplates.find(template => template.id === id);
}

// テンプレートの取得（会員種別考慮）
export function getAvailableTemplates(isPremium: boolean): NewspaperTemplate[] {
  return isPremium ? allTemplates : freeTemplates;
}