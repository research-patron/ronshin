import logging
import json
from firebase_functions import https_fn
from firebase_admin import auth, firestore
import google.cloud.logging

# Initialize logging
client = google.cloud.logging.Client()
client.setup_logging()
logging.basicConfig(level=logging.INFO)

# Initialize Firestore
db = firestore.client()

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '3600'
}

@https_fn.on_request(
    memory=512,
    timeout_sec=300,
    region="us-central1"
)
def create_newspaper_api(req: https_fn.Request) -> https_fn.Response:
    """Create newspaper Cloud Function"""
    
    if req.method == 'OPTIONS':
        return https_fn.Response('', 204, CORS_HEADERS)
    
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Method not allowed'}), 
            405, 
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )
    
    try:
        # Auth check
        auth_header = req.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return https_fn.Response(
                json.dumps({'error': 'Unauthorized'}), 
                401, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
        
        token = auth_header.split(' ')[1]
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        
        # Parse request
        data = req.get_json()
        if not data:
            return https_fn.Response(
                json.dumps({'error': 'Invalid request data'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
        
        selected_papers = data.get('selectedPapers', [])
        template_id = data.get('templateId', 'default')
        newspaper_name = data.get('newspaperName', '研究新聞')
        
        if len(selected_papers) < 3:
            return https_fn.Response(
                json.dumps({'error': 'At least 3 papers are required'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
        
        # Create newspaper
        newspaper_data = {
            'creatorId': uid,
            'name': newspaper_name,
            'selectedPapers': selected_papers[:5],
            'templateId': template_id,
            'processingStatus': 'pending',
            'isPublic': False,
            'shareSettings': {
                'allowComments': True,
                'allowedUsers': []
            },
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        }
        
        doc_ref = db.collection('newspapers').add(newspaper_data)
        newspaper_id = doc_ref[1].id
        
        # Update status (simplified)
        db.collection('newspapers').document(newspaper_id).update({
            'processingStatus': 'processing'
        })
        
        return https_fn.Response(
            json.dumps({
                'success': True,
                'newspaperId': newspaper_id,
            }),
            200,
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )
        
    except Exception as e:
        logging.error(f'Create newspaper error: {str(e)}')
        return https_fn.Response(
            json.dumps({
                'error': 'Failed to create newspaper',
                'details': str(e)
            }),
            500,
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )