import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, getAdminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Get admin services
    const auth = await getAdminAuth();
    const db = await getAdminFirestore();
    const storage = await getAdminStorage();

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

    // Upload to Storage
    const bucket = storage.bucket();
    const fileBuffer = await file.arrayBuffer();
    const storageFile = bucket.file(filename);
    
    await storageFile.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          uploadedBy: uid,
          originalName: file.name,
        }
      }
    });

    // Get download URL
    const [url] = await storageFile.getSignedUrl({
      action: 'read',
      expires: '01-01-2500', // Far future expiry
    });

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

    return NextResponse.json({
      success: true,
      paperId: paperRef.id,
      fileUrl: url,
    });

  } catch (error) {
    console.error('Paper upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload paper' },
      { status: 500 }
    );
  }
}