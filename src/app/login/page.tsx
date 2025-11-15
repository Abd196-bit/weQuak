'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    console.log('LoginPage: Auth state changed - loading:', loading, 'user:', user?.uid || 'null');
    if (!loading && user) {
      console.log('LoginPage: User is logged in, redirecting to home...');
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogin = async (data: any) => {
    console.log('LoginPage: Attempting to login with email:', data.email);
    setIsLoading(true);
    try {
      console.log('LoginPage: Calling signInWithEmailAndPassword...');
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('LoginPage: Login successful! User:', userCredential.user.uid);
      // Don't redirect here - let the useEffect above handle it after auth state updates
    } catch (error: any) {
      console.error('LoginPage: Login failed:', error);
      console.error('LoginPage: Error code:', error.code);
      console.error('LoginPage: Error message:', error.message);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AuthForm isSignUp={false} onSubmit={handleLogin} isLoading={isLoading} />
    </div>
  );
}
