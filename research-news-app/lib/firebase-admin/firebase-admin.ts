import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // Check for application credentials environment variable
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  }

  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { admin, firestore, auth, storage };