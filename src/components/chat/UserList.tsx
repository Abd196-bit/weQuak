'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, where, query, getDocs, doc, updateDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { UserPlus, MessageSquarePlus, CheckCircle, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import type { Room } from './RoomList';

interface User {
  id: string;
  username: string;
  email?: string;
  profilePictureUrl?: string;
}

interface Invite {
  id: string;
  from: string;
  fromUsername: string;
  to: string;
  toUsername?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface UserListProps {
    onSelectRoom: (room: Room) => void;
}

export default function UserList({ onSelectRoom }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([]);
  const [sentInvites, setSentInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log('UserList: Setting up listener for user:', user.uid);
    const usersRef = collection(db, 'users');
    
    const unsubscribeUsers = onSnapshot(
      usersRef, 
      (snapshot) => {
        const loadedUsers: User[] = [];
        console.log('UserList: Received snapshot with', snapshot.size, 'total users');
        
        if (snapshot.empty) {
          console.log('UserList: No users found in collection');
        }
        
        snapshot.forEach((doc) => {
          if (doc.id !== user.uid) {
            const data = doc.data();
            console.log('UserList: Processing user', doc.id, 'with data:', { username: data.username, email: data.email });
            // Only include users that have a username field
            if (data.username) {
              loadedUsers.push({ 
                id: doc.id, 
                username: data.username, 
                email: data.email,
                profilePictureUrl: data.profilePictureUrl 
              });
            } else {
              console.warn('UserList: User', doc.id, 'missing username field. Data:', data);
            }
          } else {
            console.log('UserList: Skipping current user', doc.id);
          }
        });
        
        console.log('UserList: Successfully loaded', loadedUsers.length, 'other users');
        setUsers(loadedUsers);
        setLoading(false);
      }, 
      (error) => {
        console.error("UserList: Error loading users:", error);
        console.error("UserList: Error code:", error.code);
        console.error("UserList: Error message:", error.message);
        
        if (error.code === 'permission-denied') {
          toast({ 
            variant: "destructive", 
            title: "Permission denied", 
            description: "Please check your Firestore security rules." 
          });
        } else if (error.code === 'unavailable') {
          toast({ 
            variant: "destructive", 
            title: "Connection error", 
            description: "Could not connect to Firestore. Please check your internet connection." 
          });
        } else {
          toast({ variant: "destructive", title: "Could not load users.", description: error.message });
        }
        setLoading(false);
      }
    );

    // Get received pending invites
    const receivedInvitesQuery = query(
      collection(db, 'invites'), 
      where('to', '==', user.uid), 
      where('status', '==', 'pending')
    );
    const unsubscribeReceivedInvites = onSnapshot(receivedInvitesQuery, (snapshot) => {
        const loadedInvites: Invite[] = [];
        snapshot.forEach((doc) => {
            loadedInvites.push({ id: doc.id, ...doc.data() } as Invite);
        });
        setReceivedInvites(loadedInvites);
    });

    // Get sent pending invites
    const sentInvitesQuery = query(
      collection(db, 'invites'), 
      where('from', '==', user.uid), 
      where('status', '==', 'pending')
    );
    const unsubscribeSentInvites = onSnapshot(
      sentInvitesQuery, 
      (snapshot) => {
        const loadedInvites: Invite[] = [];
        console.log('UserList: Received', snapshot.size, 'sent invites');
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('UserList: Sent invite:', { id: doc.id, to: data.to, toUsername: data.toUsername });
          loadedInvites.push({ id: doc.id, ...data } as Invite);
        });
        console.log('UserList: Setting sent invites:', loadedInvites);
        setSentInvites(loadedInvites);
      },
      (error) => {
        console.error("UserList: Error loading sent invites:", error);
        if (error.code === 'permission-denied') {
          toast({ 
            variant: "destructive", 
            title: "Permission denied", 
            description: "Please check your Firestore security rules for sent invites." 
          });
        }
      }
    );


    return () => {
        unsubscribeUsers();
        unsubscribeReceivedInvites();
        unsubscribeSentInvites();
    };
  }, [user, toast]);

  const handleInvite = async (targetUser: User) => {
    if (!user || !user.displayName) return;
    
    // Check if a DM room already exists
    const roomsRef = collection(db, 'rooms');
    const roomQuery = query(roomsRef, 
      where('isDM', '==', true),
      where('members', 'array-contains', user.uid)
    );
    
    const roomSnapshot = await getDocs(roomQuery);
    const existingRoomDoc = roomSnapshot.docs.find(doc => doc.data().members.includes(targetUser.id));

    if(existingRoomDoc) {
        const existingRoom = { id: existingRoomDoc.id, ...existingRoomDoc.data() } as Room;
        onSelectRoom(existingRoom);
        toast({ title: "Chat already exists.", description: "Opening your existing chat."});
        return;
    }

    // Check if an invite already exists either way
    const invitesRef = collection(db, 'invites');
    const inviteQuery = query(invitesRef, 
        where('members', 'array-contains-any', [user.uid, targetUser.id])
    );
    const inviteSnapshot = await getDocs(inviteQuery);
    
    const specificInvite = inviteSnapshot.docs.find(doc => {
        const members = doc.data().members;
        return members.includes(user.uid) && members.includes(targetUser.id);
    });

    if(specificInvite) {
        toast({ title: "Invite already sent.", description: "An invite is already pending with this user." });
        return;
    }

    try {
      await addDoc(collection(db, 'invites'), {
        from: user.uid,
        fromUsername: user.displayName,
        to: targetUser.id,
        toUsername: targetUser.username,
        members: [user.uid, targetUser.id], // For easier querying
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast({
        title: 'Invite Sent',
        description: `Your invite to ${targetUser.username} has been sent.`,
      });
    } catch (error) {
      console.error("Error sending invite: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to send invite',
        description: 'Please try again.',
      });
    }
  };
  
  const handleAcceptInvite = async (invite: Invite) => {
    if (!user || !user.displayName) return;
    try {
        const newRoomData = {
            name: `DM between ${invite.fromUsername} and ${user.displayName}`,
            members: [invite.from, invite.to],
            memberUsernames: [invite.fromUsername, user.displayName],
            createdAt: serverTimestamp(),
            isDM: true,
        };
        const newRoomRef = await addDoc(collection(db, 'rooms'), newRoomData);

        await updateDoc(doc(db, 'invites', invite.id), {
            status: 'accepted'
        });
        
        onSelectRoom({ id: newRoomRef.id, ...newRoomData });

        toast({
            title: 'Invite Accepted!',
            description: `You can now chat with ${invite.fromUsername}.`
        });

    } catch (error) {
        console.error("Error accepting invite:", error)
        toast({
            variant: 'destructive',
            title: 'Failed to accept invite',
        });
    }
  }

  const handleRejectInvite = async (invite: Invite) => {
    if (!user) return;
    try {
        await updateDoc(doc(db, 'invites', invite.id), {
            status: 'rejected'
        });
        
        toast({
            title: 'Invite Rejected',
            description: `You have rejected the invite from ${invite.fromUsername}.`
        });
    } catch (error) {
        console.error("Error rejecting invite:", error)
        toast({
            variant: 'destructive',
            title: 'Failed to reject invite',
        });
    }
  }

  const handleCancelInvite = async (invite: Invite) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'invites', invite.id));
        
        toast({
            title: 'Invite Cancelled',
            description: `You have cancelled the invite to ${invite.toUsername || 'user'}.`
        });
    } catch (error) {
        console.error("Error cancelling invite:", error)
        toast({
            variant: 'destructive',
            title: 'Failed to cancel invite',
        });
    }
  }

  const getReceivedInviteForUser = (targetUser: User) => {
    if (!user) return null;
    return receivedInvites.find(inv => inv.from === targetUser.id && inv.to === user.uid);
  }

  const getSentInviteForUser = (targetUser: User) => {
    if (!user) return null;
    const invite = sentInvites.find(inv => inv.from === user.uid && inv.to === targetUser.id);
    if (invite) {
      console.log(`UserList: Found sent invite for ${targetUser.username}:`, invite);
    }
    return invite;
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-background p-2 flex flex-col border-l">
      <h2 className="text-lg font-semibold mb-2 text-primary p-2">Users</h2>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
           <div className="space-y-2 p-2">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
           </div>
        ) : (
          <ul className="space-y-1 p-2">
            {users.length > 0 ? users.map((targetUser) => {
                const receivedInvite = getReceivedInviteForUser(targetUser);
                const sentInvite = getSentInviteForUser(targetUser);
                return (
              <li key={targetUser.id} className='flex items-center group/user-item gap-2'>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={targetUser.profilePictureUrl} alt={targetUser.username} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {targetUser.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className='flex-1 text-sm truncate'>{targetUser.username}</span>
                {receivedInvite ? (
                    <div className="flex items-center gap-1">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title={`Accept invite from ${receivedInvite.fromUsername}`}>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Accept chat invite from {receivedInvite.fromUsername}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will create a private chat between you and {receivedInvite.fromUsername}.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAcceptInvite(receivedInvite)}>Accept</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRejectInvite(receivedInvite)} 
                            title={`Reject invite from ${receivedInvite.fromUsername}`}
                        >
                            <X className="h-5 w-5 text-red-500" />
                        </Button>
                    </div>
                ) : sentInvite ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                title={`Cancel invite to ${targetUser.username}`}
                            >
                                <X className="h-5 w-5 text-orange-500" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancel invite to {targetUser.username}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will cancel the pending invite you sent to {targetUser.username}.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep Invite</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelInvite(sentInvite)}>Cancel Invite</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : (
                    <Button variant="ghost" size="icon" onClick={() => handleInvite(targetUser)} title={`Invite ${targetUser.username} to chat`}>
                        <MessageSquarePlus className="h-5 w-5" />
                    </Button>
                )}
              </li>
            )}) : (
                <p className='text-sm text-center text-muted-foreground p-4'>No other users found.</p>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}
