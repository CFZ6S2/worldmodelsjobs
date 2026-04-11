'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string | null;
  subscription_status: string;
  plan: string;
  role?: string;
  proAgency?: boolean;
  proAgencyActivatedAt?: string;
  isVip?: boolean;
  vipActivatedAt?: string;
  openedContacts?: string[]; // 🔥 NUEVO: Seguimiento de contactos revelados
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isPremium: boolean;
  isProAgency: boolean;
  isVip: boolean;
  isAdmin: boolean;
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
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        try {
          const profRef = doc(db, 'profiles', firebaseUser.uid);
          // Switch to onSnapshot for REAL-TIME reactivity (Crucial for contact limits)
          unsubscribeProfile = onSnapshot(profRef, (snap) => {
            if (snap.exists()) {
              setUserData(snap.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          }, (err) => {
            console.error("AuthContext: Snapshot error", err);
            setLoading(false);
          });
        } catch (e) {
          console.error("AuthContext: Error setting up listener", e);
          setUserData(null);
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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

  const isProAgency = userData?.proAgency === true;
  const isVip = userData?.isVip === true;
  const isPremium = isProAgency || isVip || userData?.subscription_status === 'active';
  const isAdmin = user?.email === 'cesar.herrera.rojo@gmail.com' || user?.email === 'ceo@worldmodels.com' || user?.email === 'gonzalo.hrrj@gmail.com' || userData?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, userData, loading, isPremium, isProAgency, isVip, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
