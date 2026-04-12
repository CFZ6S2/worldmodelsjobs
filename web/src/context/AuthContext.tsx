'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string | null;
  subscription_status: string;
  plan: string;
  role?: string;
  openedContacts?: string[];
  isVip?: boolean;
  isAdmin?: boolean;
  isProAgency?: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  isVip: boolean;
  isProAgency: boolean;
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
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const rawData = userDoc.data() as UserData;
          setUserData({
            ...rawData,
            isAdmin: rawData.role === 'admin',
            isVip: rawData.subscription_status === 'active' || rawData.role === 'admin',
            isProAgency: rawData.role === 'pro_agency' || rawData.plan === 'pro_agency'
          });
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
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isPremium = userData?.subscription_status === 'active';
  const isAdmin = userData?.role === 'admin' || userData?.isAdmin === true;
  const isVip = isPremium || isAdmin || userData?.isVip === true;
  const isProAgency = userData?.role === 'pro_agency' || userData?.plan === 'pro_agency' || userData?.isProAgency === true;

  return (
    <AuthContext.Provider value={{ user, userData, loading, isPremium, isAdmin, isVip, isProAgency, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
