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
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPaperDeleted = exports.onPaperCreated = exports.optimizeHeadline = exports.createNewspaper = exports.analyzePaper = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const paper_analysis_1 = require("./ai/paper-analysis");
Object.defineProperty(exports, "analyzePaper", { enumerable: true, get: function () { return paper_analysis_1.analyzePaper; } });
const newspaper_generator_1 = require("./utils/newspaper-generator");
// Firebase アプリの初期化
admin.initializeApp();
// 論文から新聞記事を生成する関数
exports.createNewspaper = functions.https.onCall(async (data, context) => {
    // 認証確認
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'この機能を使用するにはログインが必要です');
    }
    const { paperId, templateId } = data;
    if (!paperId || !templateId) {
        throw new functions.https.HttpsError('invalid-argument', '論文IDとテンプレートIDが必要です');
    }
    try {
        const userId = context.auth.uid;
        // 新聞生成実行
        const result = await (0, newspaper_generator_1.generateNewspaper)(paperId, templateId, userId);
        return result;
    }
    catch (error) {
        console.error('Error in createNewspaper:', error);
        throw new functions.https.HttpsError('internal', `新聞記事の生成に失敗しました: ${error.message}`);
    }
});
// 見出し生成関数
exports.optimizeHeadline = functions.https.onCall(async (data, context) => {
    // 認証確認
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'この機能を使用するにはログインが必要です');
    }
    const { content } = data;
    if (!content) {
        throw new functions.https.HttpsError('invalid-argument', '記事の内容が必要です');
    }
    try {
        // 見出し生成実行
        const headline = await (0, newspaper_generator_1.generateHeadline)(content);
        return headline;
    }
    catch (error) {
        console.error('Error in optimizeHeadline:', error);
        throw new functions.https.HttpsError('internal', `見出しの生成に失敗しました: ${error.message}`);
    }
});
// 論文アップロード時に解析タスクをエンキュー
exports.onPaperCreated = functions.firestore
    .document('papers/{paperId}')
    .onCreate(async (snapshot, context) => {
    const paperId = context.params.paperId;
    const paperData = snapshot.data();
    if (paperData &&
        paperData.fileUrl &&
        paperData.processingStatus === 'pending') {
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
exports.onPaperDeleted = functions.firestore
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
        }
        catch (error) {
            console.error(`Error deleting file for paper ${paperId}:`, error);
        }
    }
    return null;
});
//# sourceMappingURL=index.js.map