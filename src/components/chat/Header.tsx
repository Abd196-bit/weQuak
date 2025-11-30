'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Trash2, Camera, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const DuckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 21a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3h-2Zm0-12c0-2.5 1-5 4-5s4 2.5 4 5c0 1.9-1.333 4-4 4s-4-2.1-4-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 14c-3 0-5-1.5-5-4s2-4 5-4c3 0 5 1.5 5 4s-2 4-5 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

export default function Header() {
  const { logout, user, deleteAccount } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file.',
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
      });
      return;
    }
    
    setIsUploadingProfile(true);
    try {
      console.log('Header: Starting profile picture upload for user:', user.uid);
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile_pictures/${user.uid}/${Date.now()}_${file.name}`);
      console.log('Header: Uploading to storage path:', `profile_pictures/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Header: Upload successful, getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Header: Download URL:', downloadURL);
      
      // Update Firebase Auth profile
      console.log('Header: Updating Firebase Auth profile...');
      await updateProfile(user, { photoURL: downloadURL });
      console.log('Header: Firebase Auth profile updated');
      
      // Update Firestore user document
      console.log('Header: Updating Firestore user document...');
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { profilePictureUrl: downloadURL });
      console.log('Header: Firestore user document updated');
      
      setProfilePictureUrl(downloadURL);
      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Header: Error uploading profile picture:', error);
      console.error('Header: Error code:', error.code);
      console.error('Header: Error message:', error.message);
      
      let errorMessage = 'Please try again.';
      if (error.code === 'storage/unauthorized' || error.code === 'storage/permission-denied') {
        errorMessage = 'Storage permission denied. Please check your Firebase Storage rules.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Failed to upload profile picture',
        description: errorMessage,
      });
    } finally {
      setIsUploadingProfile(false);
      if (profileInputRef.current) {
        profileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;
    
    if (!password) {
      toast({
        variant: 'destructive',
        title: 'Password required',
        description: 'Please enter your password to confirm account deletion.',
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // First, re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Then delete the account
      await deleteAccount();
      toast({
        title: 'Account Deleted',
        description: 'Your account and all associated data have been deleted.',
      });
    } catch (error: any) {
      console.error('Header: Error deleting account:', error);
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast({
          variant: 'destructive',
          title: 'Authentication failed',
          description: 'Incorrect password. Please try again.',
        });
      } else if (error.code === 'auth/requires-recent-login') {
        toast({
          variant: 'destructive',
          title: 'Re-authentication required',
          description: 'Please log out and log back in, then try again.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to delete account',
          description: error.message || 'Please try again.',
        });
      }
      setIsDeleting(false);
      setPassword('');
    }
  };

  return (
    <header className="flex items-center justify-between p-3 md:p-4 bg-background">
      <div className="flex items-center gap-2">
        <DuckIcon className="text-primary h-6 w-6 md:h-8 md:w-8" />
        <h1 className="text-lg md:text-xl font-bold text-primary">We Quack</h1>
      </div>
      <div className='flex items-center gap-2'>
        {user && (
          <>
            <div className="relative group">
              <Avatar className="h-8 w-8 md:h-10 md:w-10 cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                <AvatarImage src={user.photoURL || profilePictureUrl || undefined} alt={user.displayName || 'User'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {isUploadingProfile && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                </div>
              )}
              <input
                type="file"
                ref={profileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleProfilePictureChange}
                disabled={isUploadingProfile}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -bottom-1 -right-1 h-5 w-5 md:h-6 md:w-6 rounded-full bg-background border"
                onClick={() => profileInputRef.current?.click()}
                disabled={isUploadingProfile}
                title="Change profile picture"
              >
                <Camera className="h-2.5 w-2.5 md:h-3 md:w-3" />
              </Button>
            </div>
            <span className='text-xs md:text-sm text-muted-foreground hidden sm:inline'>Hi, {user.displayName}</span>
          </>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Delete account" className="h-8 w-8 md:h-10 md:w-10">
              <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
              <span className="sr-only">Delete account</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <p>Are you sure you want to delete your account? This will permanently delete:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Your user profile</li>
                    <li>All your rooms and messages</li>
                    <li>All your invites</li>
                  </ul>
                  <p className="mt-2 font-semibold">This action cannot be undone.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="password" className="text-sm font-medium">
                Enter your password to confirm:
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="mt-2"
                disabled={isDeleting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password) {
                    handleDeleteAccount();
                  }
                }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel 
                disabled={isDeleting}
                onClick={() => {
                  setPassword('');
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting || !password}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 md:h-10 md:w-10">
          <LogOut className="h-4 w-4 md:h-5 md:w-5" />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </header>
  );
}
