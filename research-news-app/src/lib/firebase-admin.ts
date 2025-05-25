import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
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
      
      console.log('Initializing Firebase Admin with project:', projectId);
      console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        K_SERVICE: process.env.K_SERVICE, // Cloud Run service indicator
      });
      
      try {
        // In App Hosting/Cloud Run environment, use Application Default Credentials
        app = initializeApp({
          credential: applicationDefault(),
          projectId: projectId,
          storageBucket: `${projectId}.firebasestorage.app`
        });
        
        console.log('Firebase Admin initialized successfully with ADC');
      } catch (error) {
        console.log('Failed to initialize with ADC, trying without credentials:', error);
        // Fallback for local development
        app = initializeApp({
          projectId: projectId,
          storageBucket: `${projectId}.firebasestorage.app`
        });
        console.log('Firebase Admin initialized without explicit credentials');
      }
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