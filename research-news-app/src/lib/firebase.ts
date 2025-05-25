import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics is only available in the browser
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Firebase Functions URLs
const FUNCTIONS_BASE_URL = 'https://us-central1-ronshin-72b20.cloudfunctions.net';

interface PaperAnalysisResult {
  metadata: {
    title: string;
    authors: string[];
    journal?: string;
    publicationDate?: string;
    doi?: string;
  };
  aiAnalysis: {
    summary: string;
    keyPoints: string[];
    implications: string[];
  };
}

interface AnalyzePaperResponse {
  success: boolean;
  result?: PaperAnalysisResult;
  error?: string;
}

interface AnalyzePaperParams {
  paper_id: string;
  file_url: string;
  uploader_id: string;
  language?: string;
}

export const analyzePaperFunction = async (data: AnalyzePaperParams): Promise<AnalyzePaperResponse> => {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(`${FUNCTIONS_BASE_URL}/analyze_paper_http`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
    mode: 'cors',
    credentials: 'same-origin'
  });
  
  if (!response.ok) {
    throw new Error('Function call failed');
  }
  
  return await response.json() as AnalyzePaperResponse;
};

interface NewspaperContent {
  title: string;
  date: string;
  sections: {
    title: string;
    content: string;
  }[];
}

interface GenerateNewspaperResponse {
  success: boolean;
  result?: NewspaperContent;
  error?: string;
}

interface GenerateNewspaperParams {
  newspaper_id: string;
}

export const generateNewspaperFunction = async (data: GenerateNewspaperParams): Promise<GenerateNewspaperResponse> => {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(`${FUNCTIONS_BASE_URL}/generate_newspaper_http`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
    mode: 'cors',
    credentials: 'same-origin'
  });
  
  if (!response.ok) {
    throw new Error('Function call failed');
  }
  
  return await response.json() as GenerateNewspaperResponse;
};

export default app;
