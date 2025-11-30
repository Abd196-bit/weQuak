'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, where, query, getDocs, doc, updateDoc, serverTimestamp, getDoc, deleteDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { UserPlus, MessageSquarePlus, CheckCircle, X, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import type { Room } from './RoomList';

interface User {
  id: string;
  username: string;
  email?: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  online?: boolean;
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
    activeRoom?: Room | null;
}

export default function UserList({ onSelectRoom, activeRoom }: UserListProps) {
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
                profilePictureUrl: data.profilePictureUrl,
                phoneNumber: data.phoneNumber || undefined,
                online: data.online || false
              });
            }
          }
        });
        
        console.log('UserList: Successfully loaded', loadedUsers.length, 'other users');
        
        // Initial sort alphabetically - will be re-sorted when invites load
        const sortedUsers = [...loadedUsers].sort((a, b) => {
          return a.username.localeCompare(b.username);
        });
        
        setUsers(sortedUsers);
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

  // Re-sort users when invites change
  useEffect(() => {
    if (users.length === 0) return;
    
    const sortedUsers = [...users].sort((a, b) => {
      const aReceivedInvite = receivedInvites.find(inv => inv.from === a.id && inv.to === user?.uid);
      const bReceivedInvite = receivedInvites.find(inv => inv.from === b.id && inv.to === user?.uid);
      const aSentInvite = sentInvites.find(inv => inv.from === user?.uid && inv.to === a.id);
      const bSentInvite = sentInvites.find(inv => inv.from === user?.uid && inv.to === b.id);
      
      const aHasInvite = !!(aReceivedInvite || aSentInvite);
      const bHasInvite = !!(bReceivedInvite || bSentInvite);
      
      // Users with invites come first
      if (aHasInvite && !bHasInvite) return -1;
      if (!aHasInvite && bHasInvite) return 1;
      
      // Then sort alphabetically by username
      return a.username.localeCompare(b.username);
    });
    
    // Only update if order changed
    const orderChanged = sortedUsers.some((user, index) => user.id !== users[index]?.id);
    if (orderChanged) {
      setUsers(sortedUsers);
    }
  }, [users, receivedInvites, sentInvites, user]);


  const handleInviteToRoom = async (targetUser: User) => {
    if (!user || !activeRoom) return;
    
    // Check if user is already a member
    if (activeRoom.members.includes(targetUser.id)) {
      toast({
        variant: 'default',
        title: 'Already a member',
        description: `${targetUser.username} is already in this room.`,
      });
      return;
    }
    
    // Check if user is already invited
    if (activeRoom.invitedUsers?.includes(targetUser.id)) {
      toast({
        variant: 'default',
        title: 'Already invited',
        description: `${targetUser.username} has already been invited to this room.`,
      });
      return;
    }
    
    try {
      const roomRef = doc(db, 'rooms', activeRoom.id);
      await updateDoc(roomRef, {
        invitedUsers: arrayUnion(targetUser.id)
      });
      toast({
        title: 'User invited',
        description: `${targetUser.username} has been invited to ${activeRoom.name}.`,
      });
    } catch (error: any) {
      console.error("Error inviting user to room: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to invite user',
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleInvite = async (targetUser: User) => {
    if (!user || !user.displayName) return;
    
    // If there's an active room and it's a private room, invite to room instead
    if (activeRoom && !activeRoom.isDM && activeRoom.isPublic === false) {
      const isCreator = activeRoom.createdBy === user.uid || 
        (!activeRoom.createdBy && activeRoom.members.length > 0 && activeRoom.members[0] === user.uid);
      
      if (isCreator || activeRoom.members.includes(user.uid)) {
        await handleInviteToRoom(targetUser);
        return;
      }
    }
    
    // Otherwise, create a DM invite
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

  // Check if current user is admin
  const isAdmin = user?.email === 'tmw.helps@gmail.com';

  const handleDeleteUserAccount = async (targetUser: User) => {
    if (!isAdmin || !user) return;
    
    if (!confirm(`Are you sure you want to delete ${targetUser.username}'s account? This will permanently delete all their data.`)) {
      return;
    }

    try {
      toast({
        title: 'Deleting account...',
        description: `Deleting ${targetUser.username}'s account and all associated data.`,
      });

      const batch = writeBatch(db);

      // Delete user's rooms and messages
      const roomsQuery = query(collection(db, 'rooms'), where('members', 'array-contains', targetUser.id));
      const roomsSnapshot = await getDocs(roomsQuery);
      
      for (const roomDoc of roomsSnapshot.docs) {
        const roomData = roomDoc.data();
        // Delete all messages in the room
        const messagesRef = collection(db, `rooms/${roomDoc.id}/messages`);
        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.docs.forEach(msgDoc => {
          batch.delete(msgDoc.ref);
        });
        
        // Delete the room if user is creator or it's a DM
        if (roomData.createdBy === targetUser.id || roomData.isDM) {
          batch.delete(roomDoc.ref);
        }
      }

      // Delete user's invites
      const invitesQuery = query(
        collection(db, 'invites'),
        where('members', 'array-contains', targetUser.id)
      );
      const invitesSnapshot = await getDocs(invitesQuery);
      invitesSnapshot.docs.forEach(inviteDoc => {
        batch.delete(inviteDoc.ref);
      });

      // Delete user's SMS notifications
      const smsNotificationsQuery = query(
        collection(db, 'sms_notifications'),
        where('recipientUserId', '==', targetUser.id)
      );
      const smsSnapshot = await getDocs(smsNotificationsQuery);
      smsSnapshot.docs.forEach(smsDoc => {
        batch.delete(smsDoc.ref);
      });

      // Delete user document
      batch.delete(doc(db, 'users', targetUser.id));

      // Commit all deletions
      await batch.commit();

      toast({
        title: 'Account deleted',
        description: `${targetUser.username}'s account and all associated data have been deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting user account:', error);
      toast({
        variant: 'destructive',
        title: 'Error deleting account',
        description: error.message || 'Please try again.',
      });
    }
  };

  // Categorize users
  const usersWithReceivedInvites = users.filter(u => getReceivedInviteForUser(u));
  const usersWithSentInvites = users.filter(u => getSentInviteForUser(u));
  const otherUsers = users.filter(u => !getReceivedInviteForUser(u) && !getSentInviteForUser(u));

  const renderUserList = (userList: User[]) => (
    <ul className="space-y-1 p-2">
      {userList.length > 0 ? userList.map((targetUser) => {
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
            <div className="flex items-center gap-1">
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title={`Delete ${targetUser.username}'s account`}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {targetUser.username}'s Account?</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="text-sm text-muted-foreground">
                          <p>This will permanently delete {targetUser.username}'s account and all associated data including:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>User profile</li>
                            <li>All their rooms and messages</li>
                            <li>All their invites</li>
                            <li>All SMS notifications</li>
                          </ul>
                          <p className="mt-2 font-semibold">This action cannot be undone.</p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteUserAccount(targetUser)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {receivedInvite ? (
                <>
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
                </>
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleInvite(targetUser)} 
                  title={
                    activeRoom && !activeRoom.isDM && activeRoom.isPublic === false
                      ? `Invite ${targetUser.username} to ${activeRoom.name}`
                      : `Invite ${targetUser.username} to chat`
                  }
                >
                  <MessageSquarePlus className="h-5 w-5" />
                </Button>
              )}
            </div>
          </li>
        );
      }) : (
        <p className='text-sm text-center text-muted-foreground p-4'>No users in this category.</p>
      )}
    </ul>
  );

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
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="invites">
                Invites {usersWithReceivedInvites.length > 0 && `(${usersWithReceivedInvites.length})`}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-0">
              {renderUserList(users)}
            </TabsContent>
            <TabsContent value="invites" className="mt-0">
              <div className="space-y-4">
                {usersWithReceivedInvites.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground px-2 pt-2 mb-1 font-semibold uppercase">Requests ({usersWithReceivedInvites.length})</p>
                    {renderUserList(usersWithReceivedInvites)}
                  </div>
                )}
                {usersWithSentInvites.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground px-2 pt-2 mb-1 font-semibold uppercase">Sent ({usersWithSentInvites.length})</p>
                    {renderUserList(usersWithSentInvites)}
                  </div>
                )}
                {usersWithReceivedInvites.length === 0 && usersWithSentInvites.length === 0 && (
                  <p className='text-sm text-center text-muted-foreground p-4'>No pending invites.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </aside>
  );
}
