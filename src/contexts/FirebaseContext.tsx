import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

import { calculateTargets } from '../lib/goals';

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>, autoCalculateTargets?: boolean) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const profileRef = doc(db, 'user_profiles', user.uid);
        try {
          const profileDoc = await getDoc(profileRef);
          if (profileDoc.exists()) {
            setUserProfile({ userId: user.uid, ...profileDoc.data() } as UserProfile);
          } else {
            // Create default profile
            const newProfile: UserProfile = {
              userId: user.uid,
              name: user.displayName || 'Athlete',
              goal: '',
              createdAt: new Date().toISOString()
            };
            await setDoc(profileRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `user_profiles/${user.uid}`);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (updates: Partial<UserProfile>, autoCalculateTargets: boolean = true) => {
    if (!user || !userProfile) return;
    
    let finalUpdates = { ...updates };
    
    if (autoCalculateTargets) {
      const mergedProfile = { ...userProfile, ...updates };
      const targets = calculateTargets(mergedProfile);
      finalUpdates = { ...finalUpdates, ...targets };
    }

    const profileRef = doc(db, 'user_profiles', user.uid);
    try {
      await setDoc(profileRef, finalUpdates, { merge: true });
      setUserProfile(prev => prev ? { ...prev, ...finalUpdates } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `user_profiles/${user.uid}`);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, userProfile, loading, signIn, logout, updateProfile }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
