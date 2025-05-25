import logging
import tempfile
import os
from typing import Dict, Any, List
import PyPDF2
from google.cloud import storage, aiplatform
from google.cloud import secretmanager
import vertexai
from vertexai.generative_models import GenerativeModel, Part
from langdetect import detect
import json
import urllib.parse

# Initialize clients
storage_client = storage.Client()
secret_client = secretmanager.SecretManagerServiceClient()

def get_secret(secret_name: str) -> str:
    """Get secret from Secret Manager"""
    project_id = "ronshin-72b20"
    name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
    response = secret_client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text content from PDF file"""
    text = []
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
                    
        return '\n'.join(text)
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {str(e)}")
        raise

def analyze_paper(paper_id: str, file_url: str, uploader_id: str, target_language: str = "ja") -> Dict[str, Any]:
    """
    Analyze paper using Vertex AI Gemini 2.0 Flash
    """
    try:
        # Initialize Vertex AI
        project_id = "ronshin-72b20"  # Use project ID directly
        vertexai.init(project=project_id, location="us-central1")
        model = GenerativeModel("gemini-2.0-flash-001")
        
        # Download PDF to temporary file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            # Extract bucket and path from URL
            if file_url.startswith('gs://'):
                parts = file_url[5:].split('/', 1)
                bucket_name = parts[0]
                blob_name = parts[1] if len(parts) > 1 else ''
            elif 'firebasestorage.googleapis.com' in file_url:
                # Handle Firebase Storage URLs
                # URL format: https://firebasestorage.googleapis.com/v0/b/bucket-name/o/encoded-path?alt=media
                import urllib.parse
                parsed = urllib.parse.urlparse(file_url)
                path_parts = parsed.path.split('/')
                if len(path_parts) >= 5 and path_parts[3] == 'b' and path_parts[5] == 'o':
                    bucket_name = path_parts[4]
                    blob_name = urllib.parse.unquote(path_parts[6])
                else:
                    # Fallback
                    bucket_name = "ronshin-72b20.appspot.com"
                    blob_name = f"papers/{uploader_id}/{paper_id}.pdf"
            else:
                # Default bucket
                bucket_name = "ronshin-72b20.appspot.com"
                blob_name = f"papers/{uploader_id}/{paper_id}.pdf"
            
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_name)
            blob.download_to_filename(tmp_file.name)
            
            # Extract text from PDF
            extracted_text = extract_text_from_pdf(tmp_file.name)
            
            # Detect language
            try:
                language = detect(extracted_text[:1000])
            except:
                language = 'unknown'
            
            # Prepare prompt based on target language
            if target_language == "en":
                analysis_prompt = f"""
                Analyze the following academic paper and provide a detailed analysis in JSON format:

                {{
                    "title": "Paper title",
                    "authors": ["Author1", "Author2"],
                    "journal": "Journal name",
                    "publicationDate": "Publication date",
                    "doi": "DOI number",
                    "abstract": "Abstract (within 400 characters)",
                    "keywords": ["Keyword1", "Keyword2"],
                    "summary": "Summary for newspaper article (within 200 characters)",
                    "keypoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
                    "significance": "Research significance (within 100 characters)",
                    "relatedTopics": ["Related topic 1", "Related topic 2", "Related topic 3", "Related topic 4", "Related topic 5"],
                    "academicField": "Academic field",
                    "technicalLevel": "beginner/intermediate/advanced",
                    "aiConfidenceScore": 0-100,
                    "figuresReferences": ["List of figure references mentioned in the paper (e.g., Fig.1, Figure 2, Table 1)"]
                }}

                Paper text (first 10000 characters):
                {extracted_text[:10000]}
                """
            else:  # Japanese
                analysis_prompt = f"""
                以下は学術論文のテキストです。この論文を詳細に分析し、新聞記事として掲載するための情報を以下の形式でJSON形式で回答してください：

                {{
                    "title": "論文のタイトル",
                    "authors": ["著者1", "著者2"],
                    "journal": "掲載ジャーナル名",
                    "publicationDate": "出版日",
                    "doi": "DOI番号",
                    "abstract": "要約（400文字以内）",
                    "keywords": ["キーワード1", "キーワード2"],
                    "summary": "新聞記事用の要約（200文字以内、一般読者向けにわかりやすく）",
                    "keypoints": ["重要ポイント1", "重要ポイント2", "重要ポイント3", "重要ポイント4", "重要ポイント5"],
                    "significance": "研究の社会的意義（100文字以内）",
                    "relatedTopics": ["関連トピック1", "関連トピック2", "関連トピック3", "関連トピック4", "関連トピック5"],
                    "academicField": "学術分野",
                    "technicalLevel": "beginner/intermediate/advanced のいずれか",
                    "aiConfidenceScore": 0-100の数値,
                    "figuresReferences": ["論文中で参照されている図表のリスト（例：Fig.1, Figure 2, 表1など）"]
                }}

                論文テキスト（最初の10000文字）:
                {extracted_text[:10000]}
                """
            
            # Call Vertex AI
            response = model.generate_content(analysis_prompt)
            
            # Parse response
            try:
                # Extract JSON from response
                response_text = response.text
                # Find JSON content
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    analysis_data = json.loads(json_str)
                else:
                    raise ValueError("No JSON found in response")
            except Exception as e:
                logging.error(f"Failed to parse AI response: {str(e)}")
                # Fallback to basic analysis
                analysis_data = {
                    "summary": "解析中にエラーが発生しました",
                    "keypoints": ["エラーにより解析できませんでした"],
                    "significance": "不明",
                    "relatedTopics": [],
                    "academicField": "不明",
                    "technicalLevel": "intermediate",
                    "aiConfidenceScore": 0
                }
            
            # Construct metadata
            metadata = {
                "abstract": analysis_data.get("abstract", ""),
                "keywords": analysis_data.get("keywords", []),
                "extractedText": extracted_text[:5000],  # Store first 5000 chars
                "language": language,
                "pageCount": len(PyPDF2.PdfReader(open(tmp_file.name, 'rb')).pages)
            }
            
            # Update paper info if extracted
            paper_info = {
                "title": analysis_data.get("title", ""),
                "authors": analysis_data.get("authors", []),
                "journal": analysis_data.get("journal", ""),
                "publicationDate": analysis_data.get("publicationDate", ""),
                "doi": analysis_data.get("doi", "")
            }
            
            # Construct AI analysis
            ai_analysis = {
                "summary": analysis_data.get("summary", ""),
                "keypoints": analysis_data.get("keypoints", []),
                "significance": analysis_data.get("significance", ""),
                "relatedTopics": analysis_data.get("relatedTopics", []),
                "academicField": analysis_data.get("academicField", ""),
                "technicalLevel": analysis_data.get("technicalLevel", "intermediate"),
                "aiConfidenceScore": analysis_data.get("aiConfidenceScore", 50)
            }
            
            # Clean up temporary file
            os.unlink(tmp_file.name)
            
            return {
                "metadata": metadata,
                "aiAnalysis": ai_analysis,
                "paperInfo": paper_info
            }
            
    except Exception as e:
        logging.error(f"Error in paper analysis: {str(e)}")
        raise