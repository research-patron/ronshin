import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, getAdminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  console.log('Paper upload endpoint called');
  console.log('Environment:', {
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NODE_ENV: process.env.NODE_ENV,
  });

  try {
    // Get admin services
    console.log('Initializing Firebase Admin services...');
    const auth = getAdminAuth();
    const db = getAdminFirestore();
    const storage = getAdminStorage();
    console.log('Firebase Admin services initialized successfully');

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Parse request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      return NextResponse.json({ error: 'File size exceeds 20MB limit' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `papers/${uid}/${timestamp}_${file.name}`;
    console.log('Uploading file:', filename);

    // Upload to Storage
    const bucketName = `${process.env.GOOGLE_CLOUD_PROJECT_ID || 'ronshin-72b20'}.firebasestorage.app`;
    console.log('Using storage bucket:', bucketName);
    
    const bucket = storage.bucket(bucketName);
    const fileBuffer = await file.arrayBuffer();
    const storageFile = bucket.file(filename);
    console.log('Storage file object created');
    
    await storageFile.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          uploadedBy: uid,
          originalName: file.name,
        }
      }
    });
    console.log('File saved to storage');

    // Get download URL
    const [url] = await storageFile.getSignedUrl({
      action: 'read',
      expires: '01-01-2500', // Far future expiry
    });
    console.log('Signed URL generated');

    // Create paper document in Firestore
    const paperData = {
      uploaderId: uid,
      title: file.name.replace('.pdf', ''),
      authors: [],
      fileUrl: url,
      fileSize: file.size,
      processingStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const paperRef = await db.collection('papers').add(paperData);

    // Trigger AI analysis via Cloud Function
    try {
      const functionUrl = 'https://us-central1-ronshin-72b20.cloudfunctions.net/analyze_paper_http';
      const analysisResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paper_id: paperRef.id,
          file_url: url,
          uploader_id: uid,
          language: 'ja'
        })
      });

      if (!analysisResponse.ok) {
        console.error('Failed to trigger AI analysis:', await analysisResponse.text());
      }
    } catch (error) {
      console.error('Error triggering AI analysis:', error);
      // Don't fail the upload if analysis trigger fails
    }

    return NextResponse.json({
      success: true,
      paperId: paperRef.id,
      fileUrl: url,
    });

  } catch (error) {
    console.error('Paper upload error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to upload paper',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
