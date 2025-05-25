import logging
import json
from firebase_functions import https_fn
from firebase_admin import auth, firestore, storage
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
def upload_paper_api(req: https_fn.Request) -> https_fn.Response:
    """Upload paper Cloud Function"""
    
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
        
        # File handling
        files = req.files.to_dict()
        if 'file' not in files:
            return https_fn.Response(
                json.dumps({'error': 'No file provided'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
        
        file = files['file']
        if not file.filename.endswith('.pdf'):
            return https_fn.Response(
                json.dumps({'error': 'Only PDF files are allowed'}), 
                400, 
                {'Content-Type': 'application/json', **CORS_HEADERS}
            )
        
        # Upload to Storage
        import time
        timestamp = int(time.time() * 1000)
        filename = f"papers/{uid}/{timestamp}_{file.filename}"
        
        bucket = storage.bucket('ronshin-72b20.firebasestorage.app')
        blob = bucket.blob(filename)
        blob.upload_from_string(
            file.read(),
            content_type='application/pdf'
        )
        
        # Make blob publicly readable or use Firebase Storage URL
        # Since papers should be accessible to authenticated users, we'll use the public URL format
        url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{blob.name.replace('/', '%2F')}?alt=media"
        
        # Save to Firestore
        paper_data = {
            'uploaderId': uid,
            'title': file.filename.replace('.pdf', ''),
            'authors': [],
            'fileUrl': url,
            'fileSize': file.content_length or 0,
            'processingStatus': 'pending',
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        }
        
        doc_ref = db.collection('papers').add(paper_data)
        paper_id = doc_ref[1].id
        
        # Trigger analysis (simplified - just update the document)
        db.collection('papers').document(paper_id).update({
            'processingStatus': 'processing'
        })
        
        return https_fn.Response(
            json.dumps({
                'success': True,
                'paperId': paper_id,
                'fileUrl': url,
            }),
            200,
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )
        
    except Exception as e:
        logging.error(f'Upload error: {str(e)}')
        return https_fn.Response(
            json.dumps({
                'error': 'Failed to upload paper',
                'details': str(e)
            }),
            500,
            {'Content-Type': 'application/json', **CORS_HEADERS}
        )