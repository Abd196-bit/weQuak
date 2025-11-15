'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, deleteUser, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    console.log('AuthContext: Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Auth state changed - user:', user?.uid || 'null', 'email:', user?.email || 'null');
      // Always set user and stop loading first, regardless of Firestore operations
      setUser(user);
      setLoading(false);

      if (user) {
        // Ensure user document exists in Firestore (non-blocking)
        try {
          const userDocRef = doc(db, 'users', user.uid);
          // Use getDoc with source: 'server' to avoid offline cache issues initially
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            const username = user.displayName || user.email?.split('@')[0] || 'User';
            console.log('AuthContext: Creating user document for', user.uid, 'with username:', username);
            await setDoc(userDocRef, {
              username: username,
              email: user.email || '',
              profilePictureUrl: user.photoURL || null,
            });
            console.log('AuthContext: User document created successfully');
          } else {
            // Update profile picture URL if it exists in Firestore but not in Auth
            const userData = userDoc.data();
            if (userData.profilePictureUrl && !user.photoURL) {
              try {
                const { updateProfile } = await import('firebase/auth');
                await updateProfile(user, { photoURL: userData.profilePictureUrl });
              } catch (error) {
                console.warn('AuthContext: Could not update profile picture:', error);
              }
            }
            console.log('AuthContext: User document already exists for', user.uid);
          }
        } catch (error: any) {
          // Handle offline or other Firestore errors gracefully
          if (error.code === 'unavailable' || error.message?.includes('offline')) {
            console.warn('AuthContext: Firestore is offline. User document will be created when online.');
          } else {
            console.warn('AuthContext: Could not access Firestore:', error.message);
          }
          // The app will continue to work, and we can retry later when online
          // User document creation will happen on next login or when online
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const deleteAccount = async () => {
    if (!user) return;

    try {
      console.log('AuthContext: Starting account deletion for user:', user.uid);

      // Delete user's rooms and messages
      const roomsQuery = query(collection(db, 'rooms'), where('members', 'array-contains', user.uid));
      const roomsSnapshot = await getDocs(roomsQuery);
      
      const batch = writeBatch(db);
      
      // Delete all messages in user's rooms and then delete the rooms
      for (const roomDoc of roomsSnapshot.docs) {
        const roomData = roomDoc.data();
        // Only delete if user is the creator (for public rooms) or it's a DM
        if (roomData.createdBy === user.uid || roomData.isDM) {
          // Delete all messages in the room
          const messagesRef = collection(db, `rooms/${roomDoc.id}/messages`);
          const messagesSnapshot = await getDocs(messagesRef);
          messagesSnapshot.docs.forEach(msgDoc => {
            batch.delete(msgDoc.ref);
          });
          
          // Delete the room
          batch.delete(roomDoc.ref);
        }
      }

      // Delete user's invites
      const invitesQuery = query(
        collection(db, 'invites'),
        where('members', 'array-contains', user.uid)
      );
      const invitesSnapshot = await getDocs(invitesQuery);
      invitesSnapshot.docs.forEach(inviteDoc => {
        batch.delete(inviteDoc.ref);
      });

      // Delete user document
      batch.delete(doc(db, 'users', user.uid));

      // Commit all deletions
      await batch.commit();
      console.log('AuthContext: All user data deleted from Firestore');

      // Delete the auth account
      await deleteUser(user);
      console.log('AuthContext: User account deleted');

      // Sign out and redirect
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      console.error('AuthContext: Error deleting account:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    logout,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
