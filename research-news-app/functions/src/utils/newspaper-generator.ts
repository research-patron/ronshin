import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  getVertexAIClient, 
  getGeminiModel, 
  withRetry, 
  formatPrompt, 
  NEWSPAPER_GENERATION_PROMPT 
} from './vertex-ai';

/**
 * 論文の解析結果から新聞記事を生成する関数
 * @param paperId 論文ID
 * @param templateId 新聞テンプレートID
 * @param userId ユーザーID
 */
export async function generateNewspaper(
  paperId: string,
  templateId: string,
  userId: string
): Promise<{ id: string; content: any }> {
  try {
    console.log(`Generating newspaper for paper: ${paperId}, template: ${templateId}`);
    
    // 論文の解析結果を取得
    const paperDoc = await admin.firestore().collection('papers').doc(paperId).get();
    const paperData = paperDoc.data();
    
    if (!paperData || !paperData.aiAnalysis) {
      throw new Error('論文の解析結果が見つかりません');
    }
    
    // テンプレート情報を取得
    const templateDoc = await admin.firestore()
      .collection('newspaperTemplates')
      .doc(templateId)
      .get();
    const templateData = templateDoc.data();
    
    if (!templateData) {
      throw new Error('指定されたテンプレートが見つかりません');
    }
    
    // Vertex AI Gemini 2.0 Flashによる新聞記事生成
    const vertexAI = getVertexAIClient();
    const geminiModel = getGeminiModel(vertexAI);
    
    const prompt = formatPrompt(NEWSPAPER_GENERATION_PROMPT, { 
      paperAnalysis: JSON.stringify(paperData.aiAnalysis)
    });
    
    const result = await withRetry(async () => {
      return await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generation_config: {
          max_output_tokens: 2048,
          temperature: 0.4,
          top_p: 0.8,
          top_k: 40,
        }
      });
    });
    
    const generatedContent = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 生成された内容をJSONに変換
    let newspaperContent;
    try {
      // JSON形式で返ってくる場合
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        newspaperContent = JSON.parse(jsonMatch[0]);
      } else {
        // テキスト形式で返ってきた場合のフォールバック処理
        newspaperContent = {
          headline: {
            main: paperData.aiAnalysis.title || '新しい研究成果',
            sub: `${paperData.aiAnalysis.academicField || '学術'}分野の最新研究`
          },
          content: {
            lead: paperData.aiAnalysis.abstract?.substring(0, 100) || '',
            body: generatedContent.substring(0, 1000),
            conclusion: paperData.aiAnalysis.significance || ''
          },
          sideInfo: {
            keywords: paperData.aiAnalysis.keywords || [],
            relatedTopics: [],
            futureImplications: '今後の研究に影響を与える可能性があります'
          }
        };
      }
    } catch (error) {
      console.error('Error parsing generated content:', error);
      throw new Error('新聞記事の生成結果のパースに失敗しました');
    }
    
    // 新聞データをFirestoreに保存
    const newspaperData = {
      paperId,
      templateId,
      userId,
      content: newspaperContent,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'draft',
      metadata: {
        paperTitle: paperData.title || '',
        paperAuthors: paperData.authors || [],
        generationPrompt: prompt,
        templateName: templateData.name || ''
      }
    };
    
    const newspaperRef = await admin.firestore()
      .collection('newspapers')
      .add(newspaperData);
    
    console.log(`Generated newspaper: ${newspaperRef.id} for paper: ${paperId}`);
    
    return {
      id: newspaperRef.id,
      content: newspaperContent
    };
  } catch (error) {
    console.error('Error generating newspaper:', error);
    throw new Error(`新聞記事の生成に失敗しました: ${error.message}`);
  }
}

/**
 * 新聞記事の見出しを生成または最適化する関数
 * @param content 記事の内容
 */
export async function generateHeadline(
  content: string
): Promise<{ main: string; sub: string }> {
  try {
    // Vertex AI Gemini 2.0 Flashによる見出し生成
    const vertexAI = getVertexAIClient();
    const geminiModel = getGeminiModel(vertexAI);
    
    const prompt = formatPrompt(NEWSPAPER_GENERATION_PROMPT, { 
      content: content.substring(0, 1000) // 長すぎる場合は先頭1000文字を使用
    });
    
    console.log(`Generating headline for content: ${content.substring(0, 100)}...`);
    
    const result = await withRetry(async () => {
      return await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generation_config: {
          max_output_tokens: 512,
          temperature: 0.7, // 創造性を少し高めに
          top_p: 0.9,
          top_k: 40,
        }
      });
    });
    
    const generatedText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 生成された内容をJSONに変換
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const headlineData = JSON.parse(jsonMatch[0]);
        return {
          main: headlineData.headline,
          sub: headlineData.subheadline
        };
      }
    } catch (error) {
      console.error('Error parsing headline:', error);
    }
    
    // パースに失敗した場合のフォールバック
    // 簡易的に最初の行をメイン見出し、2行目をサブ見出しとして扱う
    const lines = generatedText.split('\n').filter(line => line.trim().length > 0);
    return {
      main: lines[0]?.substring(0, 20) || '新聞見出し',
      sub: lines[1]?.substring(0, 30) || '記事の内容'
    };
  } catch (error) {
    console.error('Error generating headline:', error);
    throw new Error(`見出しの生成に失敗しました: ${error.message}`);
  }
}