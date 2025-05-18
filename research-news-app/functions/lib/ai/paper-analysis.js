"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePaper = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const vertex_ai_1 = require("../utils/vertex-ai");
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
// PDF処理用の関数（PDFから暫定的にテキスト抽出）
async function extractTextFromPDF(pdfUrl) {
    try {
        // 一時ファイル用ディレクトリの作成
        const tmpDir = os.tmpdir();
        const localFilePath = path.join(tmpDir, `${(0, uuid_1.v4)()}.pdf`);
        // PDFファイルをダウンロード
        const response = await axios_1.default.get(pdfUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(localFilePath, response.data);
        // PDFからテキスト抽出（pdf-parseライブラリを使用）
        const pdfParse = require('pdf-parse');
        const buffer = Buffer.from(response.data);
        const data = await pdfParse(buffer);
        const extractedText = data.text || '';
        // 一時ファイルの削除
        fs.unlinkSync(localFilePath);
        return extractedText;
    }
    catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('PDFからのテキスト抽出に失敗しました');
    }
}
// PDFから図表を抽出する関数
async function extractFiguresFromPDF(pdfUrl, paperId) {
    try {
        // 一時ファイル用ディレクトリの作成
        const tmpDir = os.tmpdir();
        const localFilePath = path.join(tmpDir, `${(0, uuid_1.v4)()}.pdf`);
        // PDFファイルをダウンロード
        const response = await axios_1.default.get(pdfUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(localFilePath, response.data);
        // TODO: より高度な実装では、PDFJSなどを使って図表を抽出し、Cloud Storageにアップロード
        // この実装ではシンプルに情報のみを返す
        // 一時ファイルの削除
        fs.unlinkSync(localFilePath);
        // 現時点では空の配列を返す（将来的には実際の図表情報を返す）
        return [];
    }
    catch (error) {
        console.error('Error extracting figures from PDF:', error);
        throw new Error('PDFからの図表抽出に失敗しました');
    }
}
// AI解析結果をパースする関数
// テキストからリスト項目を抽出するヘルパー関数
function extractListItems(text, fieldName) {
    const regex = new RegExp(`"${fieldName}"\s*:\s*\[([^\]]+)\]`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
        // "item1", "item2" のような形式を解析
        const itemsStr = match[1].trim();
        return itemsStr
            .split(',')
            .map(item => item.trim().replace(/^"|"$/g, ''))
            .filter(item => item.length > 0);
    }
    return [];
}
// テキストからフィールド値を抽出するヘルパー関数
function extractField(text, fieldName) {
    const regex = new RegExp(`"${fieldName}"\s*:\s*"([^"]+)"`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
}
function parseAIAnalysisResult(text) {
    try {
        // 結果からJSONを抽出
        // 正規表現でJSON部分を抽出する
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const jsonStr = jsonMatch[0];
                return JSON.parse(jsonStr);
            }
            catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                // JSONのパースに失敗した場合は次の方法を試みる
            }
        }
        // タイトルなどの情報を抽出する試み
        const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/i);
        const abstractMatch = text.match(/"abstract"\s*:\s*"([^"]+)"/i);
        if (titleMatch || abstractMatch) {
            return {
                title: titleMatch ? titleMatch[1] : '不明',
                abstract: abstractMatch ? abstractMatch[1] : text.substring(0, 500),
                mainFindings: extractListItems(text, 'mainFindings'),
                keywords: extractListItems(text, 'keywords'),
                authors: extractListItems(text, 'authors'),
                significance: extractField(text, 'significance') || 'データなし',
                academicField: extractField(text, 'academicField') || '不明'
            };
        }
        // JSONが見つからない場合は構造化されたオブジェクトを手動で構築
        return {
            summary: text.substring(0, 500),
            keypoints: ['AI解析結果のパースに失敗しました'],
            significance: 'パース失敗',
            relatedTopics: [],
            academicField: '不明',
            technicalLevel: 'intermediate',
            aiConfidenceScore: 30
        };
    }
    catch (error) {
        console.error('Error parsing AI analysis result:', error);
        // パース失敗時のフォールバック
        return {
            summary: text.substring(0, 500),
            keypoints: ['AI解析結果のパースに失敗しました'],
            significance: 'パース失敗',
            relatedTopics: [],
            academicField: '不明',
            technicalLevel: 'intermediate',
            aiConfidenceScore: 30
        };
    }
}
// 論文解析を非同期で実行するCloud Function
exports.analyzePaper = functions.tasks
    .taskQueue()
    .onDispatch(async (data) => {
    const { paperId } = data;
    try {
        // 処理完了時に返す情報
        let result = { success: true };
        // 処理完了時に自動的にJSON.stringifyが適用されるvoid型に変換される
        console.log(`Starting analysis for paper: ${paperId}`);
        // 処理中ステータスに更新
        await admin.firestore().collection('papers').doc(paperId).update({
            processingStatus: 'processing',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // 論文データ取得
        const paperDoc = await admin.firestore().collection('papers').doc(paperId).get();
        const paperData = paperDoc.data();
        if (!paperData) {
            throw new Error('論文データが見つかりません');
        }
        // PDFファイルのURLを取得
        const fileUrl = paperData.fileUrl;
        // PDFからテキスト抽出
        const extractedText = await extractTextFromPDF(fileUrl);
        // PDFから図表抽出
        const figures = await extractFiguresFromPDF(fileUrl, paperId);
        // Vertex AI Gemini 2.0 Flashによる解析
        const vertexAI = (0, vertex_ai_1.getVertexAIClient)();
        const geminiModel = (0, vertex_ai_1.getGeminiModel)(vertexAI);
        // 論文要約と重要ポイント抽出
        const prompt = (0, vertex_ai_1.formatPrompt)(vertex_ai_1.PAPER_ANALYSIS_PROMPT, { paperContent: extractedText });
        const summaryResult = await (0, vertex_ai_1.withRetry)(async () => {
            return await geminiModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generation_config: {
                    max_output_tokens: 2048,
                    temperature: 0.2,
                    top_p: 0.8,
                    top_k: 40,
                }
            });
        });
        const summaryText = summaryResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // 結果をパースして構造化
        const analysis = parseAIAnalysisResult(summaryText);
        // 解析結果をFirestoreに保存
        await admin.firestore().collection('papers').doc(paperId).update({
            metadata: {
                extractedText: extractedText,
                figures: figures,
            },
            aiAnalysis: analysis,
            processingStatus: 'completed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Completed analysis for paper: ${paperId}`);
    }
    catch (error) {
        console.error('Error in paper analysis:', error);
        // エラー情報を保存
        await admin.firestore().collection('papers').doc(paperId).update({
            processingStatus: 'failed',
            errorLogs: admin.firestore.FieldValue.arrayUnion({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                message: error.message || '解析処理に失敗しました',
                code: error.code || 'unknown'
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        throw error;
    }
});
//# sourceMappingURL=paper-analysis.js.map