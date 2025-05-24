import logging
from typing import Dict, Any, List
from datetime import datetime
import json
from google.cloud import secretmanager
import vertexai
from vertexai.generative_models import GenerativeModel
import random

# Initialize clients
secret_client = secretmanager.SecretManagerServiceClient()

def get_secret(secret_name: str) -> str:
    """Get secret from Secret Manager"""
    project_id = "ronshin-72b20"
    name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
    response = secret_client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

def generate_newspaper_content(papers: List[Dict[str, Any]], template: Dict[str, Any], newspaper_id: str) -> Dict[str, Any]:
    """
    Generate newspaper content from papers using Vertex AI
    """
    try:
        # Initialize Vertex AI
        project_id = get_secret("VERTEX_AI_PROJECT_ID")
        vertexai.init(project=project_id, location="us-central1")
        model = GenerativeModel("gemini-2.0-flash-001")
        
        # Prepare paper summaries for AI
        paper_summaries = []
        for i, paper in enumerate(papers):
            ai_analysis = paper.get('aiAnalysis', {})
            paper_summaries.append(f"""
論文{i+1}:
タイトル: {paper.get('title', '不明')}
著者: {', '.join(paper.get('authors', ['不明']))}
要約: {ai_analysis.get('summary', '')}
重要ポイント: {', '.join(ai_analysis.get('keypoints', []))}
研究分野: {ai_analysis.get('academicField', '')}
意義: {ai_analysis.get('significance', '')}
            """)
        
        # Step 1: Analyze relationships and determine importance
        relationship_prompt = f"""
以下は5つの学術論文の要約です。これらの論文を分析し、新聞記事として構成するための分析を行ってください。

{chr(10).join(paper_summaries)}

以下の形式でJSON形式で回答してください：
{{
    "mainPaperIndex": メイン記事にすべき論文のインデックス（0-4）,
    "overallTheme": "全体を通したテーマや研究領域",
    "connectionMap": {{
        "0-1": "論文0と論文1の関連性",
        "0-2": "論文0と論文2の関連性",
        ...（すべての組み合わせ）
    }},
    "subArticleOrder": [サブ記事の論文インデックスの順序配列]
}}
"""
        
        relationship_response = model.generate_content(relationship_prompt)
        
        # Parse relationship analysis
        try:
            rel_text = relationship_response.text
            start_idx = rel_text.find('{')
            end_idx = rel_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                relationship_data = json.loads(rel_text[start_idx:end_idx])
            else:
                # Fallback
                relationship_data = {
                    "mainPaperIndex": 0,
                    "overallTheme": "学術研究の最新動向",
                    "subArticleOrder": [1, 2, 3, 4]
                }
        except:
            relationship_data = {
                "mainPaperIndex": 0,
                "overallTheme": "学術研究の最新動向",
                "subArticleOrder": [1, 2, 3, 4]
            }
        
        main_paper_idx = relationship_data.get('mainPaperIndex', 0)
        main_paper = papers[main_paper_idx]
        sub_paper_indices = relationship_data.get('subArticleOrder', [i for i in range(5) if i != main_paper_idx])
        
        # Step 2: Generate main article
        main_article_prompt = f"""
あなたは優れた科学ジャーナリストです。以下の学術論文を一般読者向けの新聞記事（メイン記事）に変換してください。

論文情報:
タイトル: {main_paper.get('title')}
著者: {', '.join(main_paper.get('authors', ['不明']))}
要約: {main_paper.get('aiAnalysis', {}).get('summary', '')}
重要ポイント: {chr(10).join(main_paper.get('aiAnalysis', {}).get('keypoints', []))}
意義: {main_paper.get('aiAnalysis', {}).get('significance', '')}

全体テーマ: {relationship_data.get('overallTheme', '')}

以下の形式でJSON形式で新聞記事を作成してください:
{{
    "headline": "見出し（20文字以内、インパクトのある表現）",
    "subheadline": "小見出し（30文字以内）",
    "content": "本文（500字程度、一般読者にもわかりやすく研究の重要性を伝える内容）"
}}

新聞記事として：
- 最初の段落で研究の重要性を強調
- 専門用語は避け、必要な場合は簡潔に説明
- 研究の社会的意義や将来の応用について言及
- 縦書きの新聞記事として読みやすい段落構成
"""
        
        main_response = model.generate_content(main_article_prompt)
        
        # Parse main article
        try:
            main_text = main_response.text
            start_idx = main_text.find('{')
            end_idx = main_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                main_article_data = json.loads(main_text[start_idx:end_idx])
            else:
                raise ValueError("No JSON found")
        except:
            main_article_data = {
                "headline": "最新研究が明らかにする未来",
                "subheadline": "5つの革新的発見が示す新たな可能性",
                "content": "本日発表された研究成果により、私たちの未来に大きな変革がもたらされる可能性が明らかになった..."
            }
        
        # Step 3: Generate sub articles
        sub_articles = []
        for idx in sub_paper_indices[:4]:  # Take first 4 sub papers
            if idx < len(papers):
                sub_paper = papers[idx]
                sub_prompt = f"""
以下の学術論文を簡潔な新聞記事（サブ記事）に変換してください。

論文情報:
タイトル: {sub_paper.get('title')}
著者: {', '.join(sub_paper.get('authors', ['不明']))}
要約: {sub_paper.get('aiAnalysis', {}).get('summary', '')}

以下の形式でJSON形式で記事を作成してください:
{{
    "headline": "見出し（15文字以内）",
    "content": "本文（200字程度）"
}}
"""
                
                sub_response = model.generate_content(sub_prompt)
                
                try:
                    sub_text = sub_response.text
                    start_idx = sub_text.find('{')
                    end_idx = sub_text.rfind('}') + 1
                    if start_idx != -1 and end_idx > start_idx:
                        sub_data = json.loads(sub_text[start_idx:end_idx])
                        sub_articles.append({
                            "headline": sub_data.get("headline", "研究成果"),
                            "content": sub_data.get("content", "詳細は本文をご覧ください。"),
                            "paperId": papers[idx].get('id', '')
                        })
                except:
                    sub_articles.append({
                        "headline": f"研究成果{len(sub_articles)+1}",
                        "content": "新たな発見により、この分野の理解が深まりました。",
                        "paperId": papers[idx].get('id', '')
                    })
        
        # Step 4: Generate sidebar and other content
        sidebar_prompt = f"""
以下の研究論文群の情報を基に、新聞のサイドバーコンテンツを作成してください。

全体テーマ: {relationship_data.get('overallTheme', '')}

サイドバーには以下を含めてください（200字程度）：
- 関連キーワード（5-7個）
- 研究分野の簡単な解説
- 今後の研究展望

簡潔で読者の興味を引く内容にしてください。
"""
        
        sidebar_response = model.generate_content(sidebar_prompt)
        sidebar_content = sidebar_response.text[:300]
        
        # Generate newspaper name
        newspaper_names = [
            "研究最前線タイムズ",
            "サイエンス新報",
            "学術トピックス新聞",
            "リサーチニュース",
            "研究者の眼"
        ]
        
        # Construct final newspaper content
        now = datetime.now()
        newspaper_content = {
            "header": {
                "newspaperName": random.choice(newspaper_names),
                "date": now.strftime('%Y年%m月%d日'),
                "issueNumber": f"第{random.randint(100, 999)}号"
            },
            "mainArticle": {
                "headline": main_article_data.get("headline", ""),
                "subheadline": main_article_data.get("subheadline", ""),
                "content": main_article_data.get("content", ""),
                "paperIds": [main_paper.get('id', '')]
            },
            "subArticles": sub_articles,
            "sidebarContent": sidebar_content,
            "columnContent": f"本日の特集では、{relationship_data.get('overallTheme', '最新の研究成果')}に関する5つの重要な研究をお届けしました。これらの研究は、私たちの未来に大きな影響を与える可能性を秘めています。",
            "footer": f"© {now.year} Research News Network. 本紙は学術論文を基に生成されたものです。"
        }
        
        return newspaper_content
        
    except Exception as e:
        logging.error(f"Error generating newspaper content: {str(e)}")
        raise