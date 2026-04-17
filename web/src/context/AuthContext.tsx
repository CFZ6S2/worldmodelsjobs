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
  gender?: string;
  userRole?: string;
  reputation?: string;
  signupSource?: string;
  profileType?: string;
  subscriptionStatus?: string;
  worldmodels?: { premium: boolean; liveFeed?: boolean; badge?: boolean; expiryDate?: any };
  membership?: { type: string; expiresAt?: any };
  isAdmin?: boolean;
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
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Read strictly from the unified 'users' collection 
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const rawData = userDoc.data() as UserData;
          setUserData({
            ...rawData,
            isAdmin: rawData.userRole === 'admin',
          });
        } else {
            console.warn('User authenticated but no Firestore document found in "users" collection.');
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
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const alias = email.split('@')[0];

    // Guarantee local creation of the completely unified Source-of-Truth schema
    await setDoc(doc(db, 'users', uid), {
      uid, 
      email, 
      alias, 
      gender: 'femenino', 
      userRole: 'female',
      reputation: 'BRONCE',
      createdAt: serverTimestamp(), 
      lastActivity: serverTimestamp(),
      signupSource: 'worldmodels', 
      profileType: 'wm_candidate',
      stripeCustomerId: null,
      subscriptionStatus: 'inactive',
      worldmodels: { premium: false, liveFeed: false, badge: false, expiryDate: null },
      membership: { type: 'free', expiresAt: null },
    });
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
    <AuthContext.Provider value={{ user, userData, loading, isPremium, isAdmin, isVip, isConcierge, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
