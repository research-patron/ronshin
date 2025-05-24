import json
import logging
from firebase_functions import firestore_fn, https_fn
from firebase_admin import initialize_app, firestore, storage
from google.cloud import secretmanager
import google.cloud.logging

# Initialize logging
client = google.cloud.logging.Client()
client.setup_logging()
logging.basicConfig(level=logging.INFO)

# Initialize Firebase Admin
initialize_app()

# Initialize clients
db = firestore.client()
secret_client = secretmanager.SecretManagerServiceClient()

# Import our modules
from src.ai.paper_analysis import analyze_paper
from src.utils.newspaper_generator import generate_newspaper_content

# Helper function to get secrets
def get_secret(secret_name: str) -> str:
    """Get secret from Secret Manager"""
    project_id = "ronshin-72b20"
    name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
    response = secret_client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

@https_fn.on_call()
def analyze_paper_function(req: https_fn.CallableRequest) -> dict:
    """
    Analyze uploaded paper using Vertex AI
    """
    try:
        data = req.data
        paper_id = data.get('paper_id')
        file_url = data.get('file_url')
        uploader_id = data.get('uploader_id')

        if not all([paper_id, file_url, uploader_id]):
            raise ValueError("Missing required parameters")

        logging.info(f"Starting paper analysis for paper_id: {paper_id}")

        # Perform analysis
        result = analyze_paper(paper_id, file_url, uploader_id)

        logging.info(f"Paper analysis completed for paper_id: {paper_id}")
        return {"success": True, "result": result}

    except Exception as e:
        logging.error(f"Error in analyze_paper_function: {str(e)}")
        # Update paper status to failed
        if 'paper_id' in locals():
            try:
                db.collection('papers').document(paper_id).update({
                    'processingStatus': 'failed',
                    'errorLogs': firestore.ArrayUnion([{
                        'timestamp': firestore.SERVER_TIMESTAMP,
                        'code': 'ANALYSIS_ERROR',
                        'message': str(e)
                    }])
                })
            except Exception as update_error:
                logging.error(f"Failed to update paper status: {str(update_error)}")
        
        return {"success": False, "error": str(e)}

@https_fn.on_call()
def generate_newspaper_function(req: https_fn.CallableRequest) -> dict:
    """
    Generate newspaper content using Vertex AI
    """
    try:
        data = req.data
        newspaper_id = data.get('newspaper_id')

        if not newspaper_id:
            raise ValueError("Missing newspaper_id parameter")

        logging.info(f"Starting newspaper generation for newspaper_id: {newspaper_id}")

        # Get newspaper document
        newspaper_ref = db.collection('newspapers').document(newspaper_id)
        newspaper_doc = newspaper_ref.get()
        
        if not newspaper_doc.exists:
            raise ValueError(f"Newspaper {newspaper_id} not found")

        newspaper_data = newspaper_doc.to_dict()

        # Update status to processing
        newspaper_ref.update({
            'processingStatus': 'processing',
            'updatedAt': firestore.SERVER_TIMESTAMP
        })

        # Generate content
        result = generate_newspaper_content(newspaper_id, newspaper_data)

        # Update newspaper with generated content
        newspaper_ref.update({
            'content': result,
            'processingStatus': 'completed',
            'updatedAt': firestore.SERVER_TIMESTAMP
        })

        logging.info(f"Newspaper generation completed for newspaper_id: {newspaper_id}")
        return {"success": True, "result": result}

    except Exception as e:
        logging.error(f"Error in generate_newspaper_function: {str(e)}")
        # Update newspaper status to failed
        if 'newspaper_id' in locals():
            try:
                db.collection('newspapers').document(newspaper_id).update({
                    'processingStatus': 'failed',
                    'processingError': str(e),
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
            except Exception as update_error:
                logging.error(f"Failed to update newspaper status: {str(update_error)}")
        
        return {"success": False, "error": str(e)}