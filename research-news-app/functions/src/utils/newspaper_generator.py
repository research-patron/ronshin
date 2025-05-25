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

def generate_newspaper_content(papers: List[Dict[str, Any]], template: Dict[str, Any], newspaper_id: str, language: str = "ja") -> Dict[str, Any]:
    """
    Generate newspaper content from papers using Vertex AI
    """
    try:
        # Initialize Vertex AI
        project_id = "ronshin-72b20"  # Use project ID directly
        vertexai.init(project=project_id, location="us-central1")
        model = GenerativeModel("gemini-2.0-flash-001")
        
        # Prepare paper summaries for AI
        paper_summaries = []
        for i, paper in enumerate(papers):
            ai_analysis = paper.get('aiAnalysis', {})
            if language == "en":
                paper_summaries.append(f"""
Paper {i+1}:
Title: {paper.get('title', 'Unknown')}
Authors: {', '.join(paper.get('authors', ['Unknown']))}
Summary: {ai_analysis.get('summary', '')}
Key Points: {', '.join(ai_analysis.get('keypoints', []))}
Research Field: {ai_analysis.get('academicField', '')}
Significance: {ai_analysis.get('significance', '')}
                """)
            else:
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
        if language == "en":
            relationship_prompt = f"""
Below are summaries of {len(papers)} academic papers. Analyze these papers and structure them for newspaper articles.

{chr(10).join(paper_summaries)}

Respond in JSON format:
{{
    "mainPaperIndex": Index of the paper to be the main article (0-{len(papers)-1}),
    "overallTheme": "Overall theme or research area",
    "newspaperTitle": "Creative newspaper title that captures the essence of all papers",
    "connectionMap": {{
        "0-1": "Relationship between paper 0 and paper 1",
        "0-2": "Relationship between paper 0 and paper 2",
        ...(all combinations)
    }},
    "subArticleOrder": [Array of paper indices for sub-articles]
}}
"""
        else:
            relationship_prompt = f"""
以下は{len(papers)}つの学術論文の要約です。これらの論文を分析し、新聞記事として構成するための分析を行ってください。

{chr(10).join(paper_summaries)}

以下の形式でJSON形式で回答してください：
{{
    "mainPaperIndex": メイン記事にすべき論文のインデックス（0-{len(papers)-1}）,
    "overallTheme": "全体を通したテーマや研究領域",
    "newspaperTitle": "すべての論文のエッセンスを捉えた創造的な新聞名",
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
                    "overallTheme": "Academic Research Updates" if language == "en" else "学術研究の最新動向",
                    "newspaperTitle": "Research Frontier Times" if language == "en" else "研究最前線タイムズ",
                    "subArticleOrder": list(range(1, len(papers)))
                }
        except:
            relationship_data = {
                "mainPaperIndex": 0,
                "overallTheme": "Academic Research Updates" if language == "en" else "学術研究の最新動向",
                "newspaperTitle": "Research Frontier Times" if language == "en" else "研究最前線タイムズ",
                "subArticleOrder": list(range(1, len(papers)))
            }
        
        main_paper_idx = relationship_data.get('mainPaperIndex', 0)
        main_paper = papers[main_paper_idx]
        sub_paper_indices = relationship_data.get('subArticleOrder', [i for i in range(len(papers)) if i != main_paper_idx])
        
        # Step 2: Generate main article
        if language == "en":
            main_article_prompt = f"""
You are an excellent science journalist. Convert the following academic paper into a newspaper main article for general readers.

Paper Information:
Title: {main_paper.get('title')}
Authors: {', '.join(main_paper.get('authors', ['Unknown']))}
Summary: {main_paper.get('aiAnalysis', {}).get('summary', '')}
Key Points: {chr(10).join(main_paper.get('aiAnalysis', {}).get('keypoints', []))}
Significance: {main_paper.get('aiAnalysis', {}).get('significance', '')}

Overall Theme: {relationship_data.get('overallTheme', '')}

Create a newspaper article in JSON format:
{{
    "headline": "Headline (within 50 characters, impactful expression)",
    "subheadline": "Subheadline (within 80 characters)",
    "content": "Main content (about 500 words, explaining the importance of the research in an accessible way)"
}}

As a newspaper article:
- Emphasize the importance of the research in the first paragraph
- Avoid technical jargon, explain briefly when necessary
- Mention the social significance and future applications of the research
- Structure paragraphs for easy reading
"""
        else:
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
            if language == "en":
                main_article_data = {
                    "headline": "Latest Research Reveals the Future",
                    "subheadline": "Innovative Discoveries Show New Possibilities",
                    "content": "Research results announced today reveal the potential for significant changes in our future..."
                }
            else:
                main_article_data = {
                    "headline": "最新研究が明らかにする未来",
                    "subheadline": "革新的発見が示す新たな可能性",
                    "content": "本日発表された研究成果により、私たちの未来に大きな変革がもたらされる可能性が明らかになった..."
                }
        
        # Step 3: Generate sub articles
        sub_articles = []
        for idx in sub_paper_indices[:4]:  # Take first 4 sub papers
            if idx < len(papers):
                sub_paper = papers[idx]
                if language == "en":
                    sub_prompt = f"""
Convert the following academic paper into a concise newspaper sub-article.

Paper Information:
Title: {sub_paper.get('title')}
Authors: {', '.join(sub_paper.get('authors', ['Unknown']))}
Summary: {sub_paper.get('aiAnalysis', {}).get('summary', '')}

Create an article in JSON format:
{{
    "headline": "Headline (within 40 characters)",
    "content": "Content (about 200 words)"
}}
"""
                else:
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
                            "headline": sub_data.get("headline", "Research Results" if language == "en" else "研究成果"),
                            "content": sub_data.get("content", "See the main text for details." if language == "en" else "詳細は本文をご覧ください。"),
                            "paperId": papers[idx].get('id', '')
                        })
                except:
                    sub_articles.append({
                        "headline": f"Research Result {len(sub_articles)+1}" if language == "en" else f"研究成果{len(sub_articles)+1}",
                        "content": "New discoveries deepen our understanding of this field." if language == "en" else "新たな発見により、この分野の理解が深まりました。",
                        "paperId": papers[idx].get('id', '')
                    })
        
        # Step 4: Generate sidebar and other content
        if language == "en":
            sidebar_prompt = f"""
Based on the following research papers, create sidebar content for the newspaper.

Overall Theme: {relationship_data.get('overallTheme', '')}

Include the following in the sidebar (about 200 words):
- Related keywords (5-7)
- Brief explanation of the research field
- Future research prospects

Make it concise and engaging for readers.
"""
        else:
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
        
        # Use the AI-generated newspaper title or fall back to defaults
        newspaper_title = relationship_data.get('newspaperTitle', '')
        if not newspaper_title:
            if language == "en":
                newspaper_names = [
                    "Research Frontier Times",
                    "Science Tribune",
                    "Academic Topics News",
                    "Research News",
                    "Scholar's Eye"
                ]
            else:
                newspaper_names = [
                    "研究最前線タイムズ",
                    "サイエンス新報",
                    "学術トピックス新聞",
                    "リサーチニュース",
                    "研究者の眼"
                ]
            newspaper_title = random.choice(newspaper_names)
        
        # Construct final newspaper content
        now = datetime.now()
        if language == "en":
            newspaper_content = {
                "header": {
                    "newspaperName": newspaper_title,
                    "date": now.strftime('%B %d, %Y'),
                    "issueNumber": f"Issue #{random.randint(100, 999)}"
                },
                "mainArticle": {
                    "headline": main_article_data.get("headline", ""),
                    "subheadline": main_article_data.get("subheadline", ""),
                    "content": main_article_data.get("content", ""),
                    "paperIds": [main_paper.get('id', '')]
                },
                "subArticles": sub_articles,
                "sidebarContent": sidebar_content,
                "columnContent": f"Today's feature presents {len(papers)} important research studies on {relationship_data.get('overallTheme', 'the latest research findings')}. These studies hold the potential to significantly impact our future.",
                "footer": f"© {now.year} Research News Network. This newspaper is generated based on academic papers."
            }
        else:
            newspaper_content = {
                "header": {
                    "newspaperName": newspaper_title,
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
                "columnContent": f"本日の特集では、{relationship_data.get('overallTheme', '最新の研究成果')}に関する{len(papers)}つの重要な研究をお届けしました。これらの研究は、私たちの未来に大きな影響を与える可能性を秘めています。",
                "footer": f"© {now.year} Research News Network. 本紙は学術論文を基に生成されたものです。"
            }
        
        return newspaper_content
        
    except Exception as e:
        logging.error(f"Error generating newspaper content: {str(e)}")
        raise