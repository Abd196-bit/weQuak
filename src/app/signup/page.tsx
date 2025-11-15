'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import AuthForm from '@/components/auth/AuthForm';

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignUp = async (data: any) => {
    setIsLoading(true);
    try {
      console.log('SignUpPage: Creating user with email:', data.email);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      console.log('SignUpPage: User created successfully:', user.uid);

      await updateProfile(user, {
        displayName: data.username,
      });
      console.log('SignUpPage: Profile updated with username:', data.username);

      console.log('SignUpPage: Creating user document in Firestore...');
      await setDoc(doc(db, `users/${user.uid}`), {
        username: data.username,
        email: data.email,
      });
      console.log('SignUpPage: User document created successfully in Firestore');

      // Don't redirect here - let the useEffect above handle it after auth state updates
    } catch (error: any) {
      console.error('SignUpPage: Sign-up failed:', error);
      console.error('SignUpPage: Error code:', error.code);
      console.error('SignUpPage: Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description: 'Please check your Firestore security rules. You need write access to create a user document.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign-up Failed',
          description: error.message,
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthForm isSignUp={true} onSubmit={handleSignUp} isLoading={isLoading} />
    </div>
  );
}
