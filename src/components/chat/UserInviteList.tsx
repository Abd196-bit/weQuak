'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { UserPlus, Check } from 'lucide-react';
import type { Room } from './RoomList';

interface User {
  id: string;
  username: string;
  email?: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  online?: boolean;
}

interface UserInviteListProps {
  room: Room;
  onInviteComplete?: () => void;
}

export default function UserInviteList({ room, onInviteComplete }: UserInviteListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersRef = collection(db, 'users');
    
    const unsubscribe = onSnapshot(
      usersRef, 
      (snapshot) => {
        const loadedUsers: User[] = [];
        
        snapshot.forEach((doc) => {
          if (doc.id !== user.uid) {
            const data = doc.data();
            if (data.username) {
              // Filter out users who are already members
              if (!room.members.includes(doc.id)) {
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
          }
        });
        
        // Sort alphabetically
        loadedUsers.sort((a, b) => a.username.localeCompare(b.username));
        setUsers(loadedUsers);
        setLoading(false);
      }, 
      (error) => {
        console.error("Error loading users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, room.members]);

  // Load current invited users
  useEffect(() => {
    if (room.invitedUsers) {
      setInvitedUserIds(new Set(room.invitedUsers));
    }
  }, [room.invitedUsers]);

  const handleInviteUser = async (targetUser: User) => {
    if (!user) return;
    
    if (invitedUserIds.has(targetUser.id)) {
      toast({
        variant: 'default',
        title: 'Already invited',
        description: `${targetUser.username} has already been invited.`,
      });
      return;
    }
    
    try {
      const roomRef = doc(db, 'rooms', room.id);
      await updateDoc(roomRef, {
        invitedUsers: arrayUnion(targetUser.id)
      });
      
      setInvitedUserIds(prev => new Set(prev).add(targetUser.id));
      toast({
        title: 'User invited',
        description: `${targetUser.username} has been invited to ${room.name}.`,
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

  if (loading) {
    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No users available to invite.</p>
        <p className="text-sm mt-2">All users are already members of this room.</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto space-y-2">
      {users.map((targetUser) => {
        const isInvited = invitedUserIds.has(targetUser.id);
        return (
          <div
            key={targetUser.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={targetUser.profilePictureUrl} alt={targetUser.username} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {targetUser.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{targetUser.username}</p>
              {targetUser.email && (
                <p className="text-xs text-muted-foreground truncate">{targetUser.email}</p>
              )}
            </div>
            <Button
              variant={isInvited ? "outline" : "default"}
              size="sm"
              onClick={() => handleInviteUser(targetUser)}
              disabled={isInvited}
              className="gap-2"
            >
              {isInvited ? (
                <>
                  <Check className="h-4 w-4" />
                  Invited
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Invite
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

