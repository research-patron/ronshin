import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { Paper } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Get admin services
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get request data
    const data = await request.json();
    const { paperIds, templateId, language = 'ja' } = data;

    if (!paperIds || !Array.isArray(paperIds) || paperIds.length < 3 || paperIds.length > 5) {
      return NextResponse.json(
        { error: '3 to 5 papers are required' },
        { status: 400 }
      );
    }

    // Check user membership and limits
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check generation limits for free users
    if (userData.membershipTier === 'free') {
      if (userData.generatedCount >= 3) {
        return NextResponse.json(
          { error: 'Monthly generation limit reached' },
          { status: 403 }
        );
      }

      // Check if template is premium
      const templateDoc = await db.collection('templates').doc(templateId).get();
      const templateData = templateDoc.data();
      
      if (templateData?.isPremium) {
        return NextResponse.json(
          { error: 'This template is only available for premium users' },
          { status: 403 }
        );
      }
    }

    // Verify all papers exist and belong to the user
    const paperPromises = paperIds.map(id => 
      db.collection('papers').doc(id).get()
    );
    const paperDocs = await Promise.all(paperPromises);
    
    const papers = paperDocs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Paper[];

    // Verify ownership and processing status
    for (const paper of papers) {
      if (!paper || paper.uploaderId !== uid) {
        return NextResponse.json(
          { error: 'Invalid paper selection' },
          { status: 400 }
        );
      }
      if (paper.processingStatus !== 'completed') {
        return NextResponse.json(
          { error: 'All papers must be processed before creating newspaper' },
          { status: 400 }
        );
      }
    }

    // Create newspaper document
    const newspaperData = {
      creatorId: uid,
      title: language === 'en' 
        ? `Newspaper - ${new Date().toLocaleDateString('en-US')}`
        : `新聞 - ${new Date().toLocaleDateString('ja-JP')}`,
      templateId,
      selectedPapers: paperIds,
      language,
      isPublic: false,
      shareSettings: {
        type: 'private',
        groupIds: [],
        viewCount: 0,
      },
      processingStatus: 'pending' as const,
      customSettings: {
        fontFamily: 'default',
        colorScheme: 'default',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newspaperRef = await db.collection('newspapers').add(newspaperData);

    // Update user generation count for free users
    if (userData.membershipTier === 'free') {
      await db.collection('users').doc(uid).update({
        generatedCount: userData.generatedCount + 1,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      newspaperId: newspaperRef.id,
    });

  } catch (error) {
    console.error('Newspaper creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create newspaper' },
      { status: 500 }
    );
  }
}