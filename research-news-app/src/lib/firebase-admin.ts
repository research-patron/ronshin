import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let app: App;

async function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // Try to get credentials from Secret Manager
    const client = new SecretManagerServiceClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'ronshin-72b20';
    const name = `projects/${projectId}/secrets/GOOGLE_APPLICATION_CREDENTIALS/versions/latest`;
    
    const [version] = await client.accessSecretVersion({ name });
    const credentials = JSON.parse(version.payload?.data?.toString() || '{}');

    app = initializeApp({
      credential: cert(credentials),
      projectId: projectId,
      storageBucket: `${projectId}.firebasestorage.app`
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin with Secret Manager:', error);
    
    // Fallback to environment variable if available
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'ronshin-72b20',
        storageBucket: `${process.env.GOOGLE_CLOUD_PROJECT_ID || 'ronshin-72b20'}.firebasestorage.app`
      });
    } else {
      throw new Error('Failed to initialize Firebase Admin SDK');
    }
  }

  return app;
}

export async function getAdminAuth() {
  await initializeFirebaseAdmin();
  return getAuth(app);
}

export async function getAdminFirestore() {
  await initializeFirebaseAdmin();
  return getFirestore(app);
}

export async function getAdminStorage() {
  await initializeFirebaseAdmin();
  return getStorage(app);
}