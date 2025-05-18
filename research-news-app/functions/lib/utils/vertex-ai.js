"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEADLINE_GENERATION_PROMPT = exports.PAPER_RELATIONSHIP_PROMPT = exports.NEWSPAPER_GENERATION_PROMPT = exports.PAPER_ANALYSIS_PROMPT = void 0;
exports.getVertexAIClient = getVertexAIClient;
exports.getGeminiModel = getGeminiModel;
exports.withRetry = withRetry;
exports.formatPrompt = formatPrompt;
const vertexai_1 = require("@google-cloud/vertexai");
// Vertex AI クライアントの初期化
function getVertexAIClient() {
    const projectId = process.env.VERTEX_AI_PROJECT_ID;
    const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
    if (!projectId) {
        throw new Error('VERTEX_AI_PROJECT_ID environment variable is not set');
    }
    return new vertexai_1.VertexAI({
        project: projectId,
        location: location
    });
}
// Gemini 2.0 Flash モデルの取得
function getGeminiModel(vertexAI) {
    const ai = vertexAI || getVertexAIClient();
    const modelId = process.env.VERTEX_AI_MODEL_ID || 'gemini-2.0-flash-001';
    return ai.getGenerativeModel({ model: modelId });
}
// リトライロジック付きのAPIリクエスト
async function withRetry(operation, maxRetries = 3, initialDelay = 1000) {
    let lastError = new Error('Unknown error occurred');
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (!isRetryableError(error))
                throw error;
            await delay(initialDelay * Math.pow(2, i));
        }
    }
    throw lastError;
}
// リトライ可能なエラーかどうかを判定
function isRetryableError(error) {
    const retryableErrors = [
        'RESOURCE_EXHAUSTED',
        'UNAVAILABLE',
        'DEADLINE_EXCEEDED'
    ];
    return retryableErrors.includes(error.code);
}
// 指定時間の遅延を提供するユーティリティ関数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// 論文解析のプロンプトテンプレート
exports.PAPER_ANALYSIS_PROMPT = `
あなたは学術論文を解析する専門家です。以下の論文から重要な要素を抽出し、構造化された形式で出力してください。

入力: 
\${paperContent}

必要な出力形式:
{
  "title": "論文タイトル",
  "authors": ["著者1", "著者2"],
  "abstract": "要約（400文字以内）",
  "keywords": ["キーワード1", "キーワード2"],
  "mainFindings": [
    "主要な発見1",
    "主要な発見2"
  ],
  "significance": "研究の意義（200文字以内）",
  "academicField": "該当する学術分野"
}

制約条件:
- 専門用語は可能な限り平易な表現に置き換える
- 重要な数値データは保持する
- 研究の新規性・独自性を明確に示す
`;
// 新聞生成のプロンプトテンプレート
exports.NEWSPAPER_GENERATION_PROMPT = `
あなたは科学ジャーナリストです。提供された論文の解析結果を、一般読者向けの新聞記事に変換してください。

入力:
\${paperAnalysis}

必要な出力形式:
{
  "headline": {
    "main": "メイン見出し（20文字以内）",
    "sub": "サブ見出し（30文字以内）"
  },
  "content": {
    "lead": "リード文（100文字以内）",
    "body": "本文（1000文字以内）",
    "conclusion": "結論（100文字以内）"
  },
  "sideInfo": {
    "keywords": ["キーワード1", "キーワード2"],
    "relatedTopics": ["関連トピック1", "関連トピック2"],
    "futureImplications": "今後の展望（100文字以内）"
  }
}

制約条件:
- 一般読者を想定し、平易な表現を使用
- 研究の社会的意義を強調
- 縦書きでの読みやすさを考慮
- 具体的な例や比喩を活用
`;
// 論文関連性分析のプロンプトテンプレート
exports.PAPER_RELATIONSHIP_PROMPT = `
以下は複数の学術論文の要約です。これらの論文間の関連性を分析し、新聞記事として構成するための重要度順位付けと関連性マップを作成してください。
          
\${paperSummaries}
          
以下の形式で出力してください:
1. メイン記事として扱うべき論文（最も重要または中心的な論文）
2. サブ記事として扱うべき論文順位
3. 論文間の関連性マップ（どの論文がどのように関連しているか）
4. 全体を通した大きなテーマまたは研究領域
`;
// 見出し生成のプロンプトテンプレート
exports.HEADLINE_GENERATION_PROMPT = `
以下の文章から新聞の見出しを作成してください。注目を集め、内容を正確に表現する簡潔な見出しを作成してください。

文章:
\${content}

以下の形式で回答：
{
  "headline": "メイン見出し（15〜20文字以内）",
  "subheadline": "サブ見出し（25〜30文字以内）"
}

条件:
- 新聞の見出しらしさを意識（インパクト、簡潔さ）
- 最重要情報を含める
- センセーショナルすぎない、事実に基づいた表現
`;
// プロンプトのフォーマット関数
function formatPrompt(template, variables) {
    let formatted = template;
    Object.entries(variables).forEach(([key, value]) => {
        formatted = formatted.replace(`\${${key}}`, String(value));
    });
    return formatted;
}
//# sourceMappingURL=vertex-ai.js.map