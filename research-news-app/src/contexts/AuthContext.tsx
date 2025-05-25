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

interface AuthState {
  currentUser: FirebaseUser | null;
  userData: User | null;
  authChecked: boolean;
  userDataLoading: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    currentUser: null,
    userData: null,
    authChecked: false,
    userDataLoading: false
  });

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

  // Signup with email and password
  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user document
      await createUserDocument(user);
      
      // User data will be updated by onAuthStateChanged
      
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
    setState(prev => ({ ...prev, userData: null }));
  };

  // Reset password
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Update user profile
  const updateUserProfile = async (displayName: string) => {
    if (!state.currentUser) throw new Error('No user logged in');
    
    await updateProfile(state.currentUser, { displayName });
    
    // Update in Firestore
    const userRef = doc(db, 'users', state.currentUser.uid);
    await setDoc(userRef, {
      displayName,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    if (!state.currentUser) throw new Error('No user logged in');
    await sendEmailVerification(state.currentUser);
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setState(prev => ({ ...prev, currentUser: user, authChecked: true }));
      
      if (user) {
        setState(prev => ({ ...prev, userDataLoading: true }));
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setState(prev => ({
              ...prev,
              userData: userSnap.data() as User,
              userDataLoading: false
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setState(prev => ({ ...prev, userDataLoading: false }));
        }
      } else {
        setState(prev => ({ ...prev, userData: null, userDataLoading: false }));
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser: state.currentUser,
    userData: state.userData,
    loading: !state.authChecked || state.userDataLoading,
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
      {state.authChecked && children}
    </AuthContext.Provider>
  );
};
