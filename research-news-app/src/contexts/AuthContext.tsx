'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user document in Firestore
  const createUserDocument = async (user: FirebaseUser): Promise<User> => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUser: Omit<User, 'createdAt' | 'updatedAt'> = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'User',
          profileImageUrl: user.photoURL || undefined,
          membershipTier: 'free',
          generatedCount: 0,
          savedNewspapersCount: 0,
          preferredLanguage: 'ja',
          settings: {
            notifications: true,
            theme: 'system'
          }
        };

        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Return the user object with timestamps
        return {
          ...newUser,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        } as User;
      }

      return userSnap.data() as User;
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserData(userSnap.data() as User);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Signup with email and password
  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user document
      const userData = await createUserDocument(user);
      setUserData(userData);
      
      // Send email verification
      try {
        await sendEmailVerification(user);
      } catch (verificationError) {
        console.error('Email verification error:', verificationError);
        // Continue without throwing - user is created successfully
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login time
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  };

  // Login with Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    
    // Create or update user document
    await createUserDocument(user);
    
    // Update last login time
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  // Reset password
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Update user profile
  const updateUserProfile = async (displayName: string) => {
    if (!currentUser) throw new Error('No user logged in');
    
    await updateProfile(currentUser, { displayName });
    
    // Update in Firestore
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, {
      displayName,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    if (!currentUser) throw new Error('No user logged in');
    await sendEmailVerification(currentUser);
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    sendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};