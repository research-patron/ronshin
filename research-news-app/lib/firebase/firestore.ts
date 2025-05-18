import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  Query,
  QueryDocumentSnapshot,
  FirestoreError
} from 'firebase/firestore';
import { db } from './firebase';

// Type for a document with ID
export interface DocumentWithId<T> extends T {
  id: string;
}

// Error handling utility
const handleFirestoreError = (error: unknown): never => {
  const firestoreError = error as FirestoreError;
  console.error('Firestore error:', firestoreError);
  throw new Error(`Firestore operation failed: ${firestoreError.message}`);
};

/**
 * Get a single document by ID from a collection
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @returns The document data with ID or null if not found
 */
export async function getDocumentById<T>(
  collectionName: string, 
  docId: string
): Promise<DocumentWithId<T> | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as DocumentWithId<T>;
    } else {
      return null;
    }
  } catch (error) {
    handleFirestoreError(error);
  }
}

/**
 * Interface for pagination options
 */
export interface PaginationOptions {
  pageSize?: number;
  lastDocSnapshot?: QueryDocumentSnapshot<DocumentData>;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Interface for filter options
 */
export interface FilterOption {
  field: string;
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
  value: any;
}

/**
 * Get documents from a collection with optional filtering and pagination
 * @param collectionName - Name of the collection
 * @param filterOptions - Optional array of filter options
 * @param paginationOptions - Optional pagination options
 * @returns Array of documents with their IDs and pagination info
 */
export async function getDocuments<T>(
  collectionName: string,
  filterOptions?: FilterOption[],
  paginationOptions?: PaginationOptions
): Promise<{
  documents: DocumentWithId<T>[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  try {
    // Build query constraints
    const constraints: QueryConstraint[] = [];
    
    // Add filters if provided
    if (filterOptions && filterOptions.length > 0) {
      filterOptions.forEach(filter => {
        constraints.push(where(filter.field, filter.operator, filter.value));
      });
    }
    
    // Add ordering if provided
    if (paginationOptions?.orderByField) {
      constraints.push(orderBy(
        paginationOptions.orderByField,
        paginationOptions.orderDirection || 'asc'
      ));
    }
    
    // Create base query
    let q: Query<DocumentData> = query(collection(db, collectionName), ...constraints);
    
    // Add pagination if provided
    const pageSize = paginationOptions?.pageSize || 10;
    
    if (paginationOptions?.lastDocSnapshot) {
      q = query(q, startAfter(paginationOptions.lastDocSnapshot), limit(pageSize));
    } else {
      q = query(q, limit(pageSize));
    }
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Transform results
    const documents: DocumentWithId<T>[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() } as DocumentWithId<T>);
    });
    
    // Get the last document for pagination
    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    
    // Determine if there are more documents
    const hasMore = querySnapshot.docs.length === pageSize;
    
    return { documents, lastDoc, hasMore };
  } catch (error) {
    handleFirestoreError(error);
  }
}

/**
 * Add a new document to a collection
 * @param collectionName - Name of the collection
 * @param data - Document data to add
 * @returns The ID of the created document
 */
export async function addDocument<T>(
  collectionName: string, 
  data: WithFieldValue<T>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error);
  }
}

/**
 * Update an existing document
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @param data - Partial data to update
 * @returns Promise that resolves when the update is complete
 */
export async function updateDocument<T>(
  collectionName: string, 
  docId: string, 
  data: Partial<WithFieldValue<T>>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data as DocumentData);
  } catch (error) {
    handleFirestoreError(error);
  }
}

/**
 * Delete a document from a collection
 * @param collectionName - Name of the collection 
 * @param docId - Document ID to delete
 * @returns Promise that resolves when the delete is complete
 */
export async function deleteDocument(
  collectionName: string, 
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error);
  }
}

/**
 * Get a document reference
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @returns Document reference
 */
export function getDocumentRef(
  collectionName: string, 
  docId: string
): DocumentReference {
  return doc(db, collectionName, docId);
}