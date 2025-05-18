import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin/firebase-admin';

export async function getAuthenticatedUser(req: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export function requireAuth(callback: Function) {
  return async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return callback(req, user);
  };
}

export function checkMembershipTier(tier: 'free' | 'premium') {
  return async (req: NextRequest, user: any) => {
    // Fetch user document from Firestore
    const userRecord = await auth.getUser(user.uid);
    
    // TODO: Implement actual membership check from Firestore
    // This is a placeholder
    const userTier = 'free'; // Should be fetched from database
    
    if (tier === 'premium' && userTier !== 'premium') {
      return NextResponse.json(
        { error: 'Premium membership required' },
        { status: 403 }
      );
    }
    
    return true;
  };
}