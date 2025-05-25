import logging
import json
from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore
import google.cloud.logging

# Initialize logging
client = google.cloud.logging.Client()
client.setup_logging()
logging.basicConfig(level=logging.INFO)

# Initialize Firebase Admin
initialize_app()

# Initialize Firestore
db = firestore.client()

# Import our modules
from src.ai.paper_analysis import analyze_paper
from src.utils.newspaper_generator import generate_newspaper_content

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-firebase-appcheck',
    'Access-Control-Max-Age': '3600'
}

@https_fn.on_request(
    memory=512,  # 512MB
    timeout_sec=540,  # 9 minutes
    region="us-central1"
)
def analyze_paper_http(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP version of analyze_paper_function with manual CORS handling
    """
    # Handle preflight OPTIONS request
    if req.method == 'OPTIONS':
        return https_fn.Response('', 204, CORS_HEADERS)
    
    # Only allow POST requests
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Method not allowed'}), 
            405, 
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )
    
    try:
        # Parse request data
        data = req.get_json()
        if not data:
            return https_fn.Response(
                json.dumps({'error': 'Invalid request data'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
        
        # Get data from request
        paper_id = data.get("paper_id")
        file_url = data.get("file_url")  
        uploader_id = data.get("uploader_id")
        target_language = data.get("language", "ja")
        
        logging.info(f"analyze_paper_http called with paper_id: {paper_id}")
        
        if not all([paper_id, file_url, uploader_id]):
            return https_fn.Response(
                json.dumps({'error': 'Missing required parameters'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
            
        # Perform analysis
        result = analyze_paper(paper_id, file_url, uploader_id, target_language)
        
        # Update Firestore
        paper_ref = db.collection('papers').document(paper_id)
        paper_ref.update({
            'processingStatus': 'completed',
            'metadata': result['metadata'],
            'aiAnalysis': result['aiAnalysis'],
            'title': result['paperInfo'].get('title', ''),
            'authors': result['paperInfo'].get('authors', []),
            'journal': result['paperInfo'].get('journal', ''),
            'publicationDate': result['paperInfo'].get('publicationDate', ''),
            'doi': result['paperInfo'].get('doi', ''),
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        logging.info(f"Paper analysis completed for paper_id: {paper_id}")
        
        return https_fn.Response(
            json.dumps({"success": True, "result": result}),
            200,
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )
        
    except Exception as e:
        logging.error(f"Error in analyze_paper_http: {str(e)}")
        
        # Update paper status to failed
        if 'paper_id' in locals() and paper_id:
            try:
                db.collection('papers').document(paper_id).update({
                    'processingStatus': 'failed',
                    'processingError': str(e),
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
            except Exception as update_error:
                logging.error(f"Failed to update paper status: {str(update_error)}")
                
        return https_fn.Response(
            json.dumps({'error': str(e)}),
            500,
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )

@https_fn.on_request(
    memory=512,  # 512MB
    timeout_sec=540,  # 9 minutes  
    region="us-central1"
)
def generate_newspaper_http(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP version of generate_newspaper_function with manual CORS handling
    """
    # Handle preflight OPTIONS request
    if req.method == 'OPTIONS':
        return https_fn.Response('', 204, CORS_HEADERS)
    
    # Only allow POST requests
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Method not allowed'}), 
            405, 
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )
    
    try:
        # Parse request data
        data = req.get_json()
        if not data:
            return https_fn.Response(
                json.dumps({'error': 'Invalid request data'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
        
        newspaper_id = data.get("newspaper_id")
        
        if not newspaper_id:
            return https_fn.Response(
                json.dumps({'error': 'Missing newspaper_id parameter'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
            
        logging.info(f"Starting newspaper generation for newspaper_id: {newspaper_id}")
        
        # Get newspaper document
        newspaper_ref = db.collection('newspapers').document(newspaper_id)
        newspaper_doc = newspaper_ref.get()
        
        if not newspaper_doc.exists:
            return https_fn.Response(
                json.dumps({'error': f'Newspaper {newspaper_id} not found'}), 
                404, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
            
        newspaper_data = newspaper_doc.to_dict()
        
        # Update status to processing
        newspaper_ref.update({
            'processingStatus': 'processing',
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        # Get papers
        paper_ids = newspaper_data.get('selectedPapers', [])
        if len(paper_ids) < 3:
            return https_fn.Response(
                json.dumps({'error': 'At least 3 papers are required'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
            
        # Fetch paper details
        papers = []
        for paper_id in paper_ids[:5]:  # Max 5 papers
            paper_doc = db.collection('papers').document(paper_id).get()
            if paper_doc.exists:
                papers.append({
                    'id': paper_id,
                    **paper_doc.to_dict()
                })
                
        if len(papers) < 3:
            return https_fn.Response(
                json.dumps({'error': 'Could not fetch enough valid papers'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
            
        # Generate content
        template = newspaper_data.get('template', {})
        language = newspaper_data.get('language', 'ja')
        result = generate_newspaper_content(papers, template, newspaper_id, language)
        
        # Update newspaper with generated content
        newspaper_ref.update({
            'content': result,
            'processingStatus': 'completed',
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        logging.info(f"Newspaper generation completed for newspaper_id: {newspaper_id}")
        
        return https_fn.Response(
            json.dumps({"success": True, "result": result}),
            200,
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )
        
    except Exception as e:
        logging.error(f"Error in generate_newspaper_http: {str(e)}")
        
        # Update newspaper status to failed
        if 'newspaper_id' in locals() and newspaper_id:
            try:
                db.collection('newspapers').document(newspaper_id).update({
                    'processingStatus': 'failed',
                    'processingError': str(e),
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
            except Exception as update_error:
                logging.error(f"Failed to update newspaper status: {str(update_error)}")
                
        return https_fn.Response(
            json.dumps({'error': str(e)}),
            500,
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )