import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App | undefined;

function ensureInitialized(): App {
  if (!app) {
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      // Initialize Firebase Admin SDK
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 
                       process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                       'ronshin-72b20';
      
      // In App Hosting environment, the SDK can auto-detect credentials
      app = initializeApp({
        projectId: projectId,
        storageBucket: `${projectId}.firebasestorage.app`
      });
      
      console.log('Firebase Admin initialized with project:', projectId);
    }
  }
  return app;
}

export function getAdminAuth() {
  const adminApp = ensureInitialized();
  return getAuth(adminApp);
}

export function getAdminFirestore() {
  const adminApp = ensureInitialized();
  return getFirestore(adminApp);
}

export function getAdminStorage() {
  const adminApp = ensureInitialized();
  return getStorage(adminApp);
}