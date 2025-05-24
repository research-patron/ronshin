import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  profileImageUrl?: string;
  membershipTier: 'free' | 'premium';
  membershipStartDate?: Timestamp;
  membershipEndDate?: Timestamp;
  paymentId?: string;
  generatedCount: number;
  savedNewspapersCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  preferredLanguage: 'ja' | 'en' | 'zh';
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

// Paper types
export interface Paper {
  id: string;
  uploaderId: string;
  title: string;
  authors: string[];
  journal?: string;
  publicationDate?: string;
  doi?: string;
  fileUrl: string;
  fileSize: number;
  metadata?: {
    abstract?: string;
    keywords?: string[];
    figures?: Figure[];
    tables?: Table[];
    citations?: Citation[];
    extractedText?: string;
  };
  aiAnalysis?: {
    summary: string;
    keypoints: string[];
    significance: string;
    relatedTopics: string[];
    academicField: string;
    technicalLevel: 'beginner' | 'intermediate' | 'advanced';
    aiConfidenceScore: number;
  };
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorLogs?: ErrorLog[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Figure {
  id: string;
  caption: string;
  imageUrl: string;
  page: number;
  importance: number;
}

export interface Table {
  id: string;
  caption: string;
  data: string;
  page: number;
}

export interface Citation {
  id: string;
  text: string;
  reference: string;
}

export interface ErrorLog {
  timestamp: Timestamp;
  code: string;
  message: string;
}

// Newspaper types
export interface Newspaper {
  id: string;
  creatorId: string;
  title: string;
  templateId: string;
  isPublic: boolean;
  shareSettings: {
    type: 'private' | 'group' | 'public';
    groupIds?: string[];
    viewCount: number;
    shareUrl?: string;
  };
  content?: NewspaperContent;
  customSettings: {
    fontFamily: string;
    colorScheme: string;
    logoUrl?: string;
  };
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  exportHistory?: ExportRecord[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NewspaperContent {
  header: {
    newspaperName: string;
    date: string;
    issueNumber: string;
  };
  mainArticle: {
    headline: string;
    subheadline: string;
    content: string;
    imageUrl?: string;
    paperIds: string[];
  };
  subArticles: SubArticle[];
  sidebarContent?: string;
  columnContent?: string;
  adContent?: string;
  footer: string;
}

export interface SubArticle {
  headline: string;
  content: string;
  imageUrl?: string;
  paperId: string;
}

export interface ExportRecord {
  type: 'pdf' | 'png' | 'print';
  url: string;
  createdAt: Timestamp;
}

// Group types
export interface Group {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  members: GroupMember[];
  sharedNewspapers: string[];
  invitationLinks?: InvitationLink[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Timestamp;
  lastActivity?: Timestamp;
}

export interface InvitationLink {
  id: string;
  url: string;
  expiresAt: Timestamp;
  usedCount: number;
  maxUses?: number;
}

// Template types
export interface Template {
  id: string;
  name: string;
  description: string;
  previewImageUrl: string;
  isPremium: boolean;
  category: 'standard' | 'academic' | 'magazine' | 'tabloid';
  layout: TemplateLayout;
  compatibleLanguages: string[];
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TemplateLayout {
  version: string;
  components: LayoutComponent[];
}

export interface LayoutComponent {
  type: string;
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  styles: Record<string, unknown>;
  content?: Record<string, unknown>;
}

// Payment types
export interface Payment {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'active' | 'canceled' | 'past_due';
  startDate: Timestamp;
  endDate: Timestamp;
  paymentMethod?: {
    type: 'credit_card' | 'bank_transfer';
    last4?: string;
    brand?: string;
    expiryDate?: string;
  };
  invoices?: Invoice[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  paidAt?: Timestamp;
  receiptUrl?: string;
}

// System settings types
export interface SystemSettings {
  id: string;
  aiSettings: {
    modelVersion: string;
    maxTokens: number;
    temperatureDefault: number;
    contextWindowSize: number;
  };
  freeUserLimits: {
    generationCount: number;
    savedNewspaperCount: number;
    exportFormats: string[];
  };
  premiumUserLimits: {
    maxStorageSize: number;
    maxFileSize: number;
  };
  maintenanceMode: boolean;
  notificationMessages?: NotificationMessage[];
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface NotificationMessage {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  startDate: Timestamp;
  endDate: Timestamp;
}