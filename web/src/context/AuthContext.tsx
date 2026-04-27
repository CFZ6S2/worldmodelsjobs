'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string | null;
  alias?: string;
  bio?: string;
  city?: string;
  gender?: string;
  height?: string;
  measurements?: string;
  surgeries?: string;
  tattoos?: string;
  gallery?: string[];
  photoURL?: string;
  userRole?: string;
  reputation?: string;
  signupSource?: string;
  profileType?: string;
  subscriptionStatus?: string;
  worldmodels?: { premium: boolean; liveFeed?: boolean; badge?: boolean; expiryDate?: any };
  membership?: { type: string; expiresAt?: any };
  isAdmin?: boolean;
  openedContacts?: string[];
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  isVip: boolean;
  isConcierge: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const updateProfileData = async (data: Partial<UserData>) => {
    if (!user) throw new Error('No user authenticated');
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    setUserData(prev => prev ? { ...prev, ...data } : null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Attempt 1: Unified 'users' collection
          let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          // Attempt 2: Legacy 'profiles' collection
          if (!userDoc.exists()) {
            userDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid));
          }

          if (userDoc.exists()) {
            const rawData = userDoc.data() as UserData;
            setUserData({
              ...rawData,
              isAdmin: rawData.userRole === 'admin' || rawData.isAdmin === true,
            });
          } else {
            console.warn('User doc not found in users or profiles.');
            setUserData(null);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    // Single canonical source of registration via Backend API
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName: email.split('@')[0] })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
    }
    
    // Auto-login to populate AuthContext with the newly minted Unified User Profile
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Derive permissions mathematically strictly from unifying source of truth
  const isPremium = userData?.worldmodels?.premium === true;
  const isAdmin = userData?.userRole === 'admin' || userData?.isAdmin === true;
  const isVip = isPremium || isAdmin;
  const isConcierge = userData?.userRole === 'concierge';

  return (
    <AuthContext.Provider value={{ user, userData, loading, isPremium, isAdmin, isVip, isConcierge, login, register, logout, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
