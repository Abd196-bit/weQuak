'use client';

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { PlusCircle, MessageSquare, Trash2, LogOut, Lock, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

export interface Room {
  id: string;
  name: string;
  members: string[];
  isDM: boolean;
  memberUsernames?: string[];
  createdBy?: string;
  isPublic?: boolean;
  invitedUsers?: string[];
}

interface RoomListProps {
  onSelectRoom: (room: Room) => void;
  activeRoomId?: string;
}

export default function RoomList({ onSelectRoom, activeRoomId }: RoomListProps) {
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [dmRooms, setDmRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('RoomList: Setting up listeners for user:', user.uid);
    const roomsRef = collection(db, 'rooms');
    
    // Query 1: Get all public rooms (rooms where isDM is false and isPublic is true)
    // Also get private rooms where user is a member or invited
    const publicRoomsQuery = query(roomsRef, where('isDM', '==', false));
    
    // Query 2: Get DM rooms where user is a member
    const dmRoomsQuery = query(roomsRef, where('isDM', '==', true), where('members', 'array-contains', user.uid));

    let publicRoomsUnsubscribe: (() => void) | null = null;
    let dmRoomsUnsubscribe: (() => void) | null = null;
    let publicRoomsData: Room[] = [];
    let dmRoomsData: Room[] = [];

    const updateRooms = () => {
      const userDisplayName = user.displayName || user.email?.split('@')[0] || 'User';
      const processedDmRooms = dmRoomsData.map(room => {
        const otherMemberUsername = room.memberUsernames?.find(username => username !== userDisplayName) || 'User';
        return { ...room, name: otherMemberUsername };
      });
      
      console.log('RoomList: Loaded', publicRoomsData.length, 'public rooms and', processedDmRooms.length, 'DM rooms');
      setPublicRooms(publicRoomsData);
      setDmRooms(processedDmRooms);
      setLoading(false);
      
      const allRooms = [...publicRoomsData, ...processedDmRooms];
      if (!activeRoomId && allRooms.length > 0) {
        const firstRoom = processedDmRooms.length > 0 ? processedDmRooms[0] : publicRoomsData[0];
        if (firstRoom) {
            onSelectRoom(firstRoom);
        }
      } else if (activeRoomId && allRooms.length > 0) {
        const roomToSelect = allRooms.find(r => r.id === activeRoomId) || allRooms[0];
        onSelectRoom(roomToSelect);
      }
    };

    // Listen to public rooms
    publicRoomsUnsubscribe = onSnapshot(
      publicRoomsQuery,
      (snapshot) => {
        publicRoomsData = [];
        console.log('RoomList: Received', snapshot.size, 'public rooms');
        snapshot.forEach((doc) => {
          const data = doc.data();
          const room = {
            id: doc.id,
            ...(data as Omit<Room, 'id'>),
          };
          // Only show public rooms or private rooms where user is a member or invited
          const isPublic = data.isPublic !== false; // Default to true for backwards compatibility
          const isMember = room.members.includes(user.uid);
          const isInvited = room.invitedUsers?.includes(user.uid) || false;
          
          if (isPublic || isMember || isInvited) {
            publicRoomsData.push(room);
          }
        });
        updateRooms();
      },
      (error) => {
        console.error("RoomList: Error fetching public rooms:", error);
        if (error.code === 'permission-denied') {
          toast({
            variant: 'destructive', 
            title: "Permission denied", 
            description: "Please check your Firestore security rules for the 'rooms' collection."
          });
        }
        setLoading(false);
      }
    );

    // Listen to DM rooms
    dmRoomsUnsubscribe = onSnapshot(
      dmRoomsQuery,
      (snapshot) => {
        dmRoomsData = [];
        console.log('RoomList: Received', snapshot.size, 'DM rooms');
        snapshot.forEach((doc) => {
          const data = doc.data();
          dmRoomsData.push({
            id: doc.id,
            ...(data as Omit<Room, 'id'>),
          });
        });
        updateRooms();
      },
      (error) => {
        console.error("RoomList: Error fetching DM rooms:", error);
        if (error.code === 'permission-denied') {
          toast({
            variant: 'destructive', 
            title: "Permission denied", 
            description: "Please check your Firestore security rules for the 'rooms' collection."
          });
        }
        setLoading(false);
      }
    );

    return () => {
      if (publicRoomsUnsubscribe) publicRoomsUnsubscribe();
      if (dmRoomsUnsubscribe) dmRoomsUnsubscribe();
    };
  }, [user, onSelectRoom, activeRoomId, toast]);

  const handleCreateRoom = async () => {
    if (newRoomName.trim() === '' || !user) return;
    setIsCreating(true);

    try {
      const username = user.displayName || user.email?.split('@')[0] || 'User';
      const newRoomData: any = {
        name: newRoomName.trim(),
        members: [user.uid],
        memberUsernames: [username],
        createdAt: serverTimestamp(),
        isDM: false,
        createdBy: user.uid,
        isPublic: isPublicRoom,
        invitedUsers: [],
      };
      
      console.log('RoomList: Creating room with data:', newRoomData);
      const newRoomRef = await addDoc(collection(db, 'rooms'), newRoomData);
      console.log('RoomList: Room created successfully with ID:', newRoomRef.id);
      
      setNewRoomName('');
      setIsPublicRoom(true);
      setIsDialogOpen(false);
      onSelectRoom({ id: newRoomRef.id, ...newRoomData });
      toast({ title: 'Room created!' });
    } catch (error: any) {
      console.error("RoomList: Error creating room:", error);
      console.error("RoomList: Error code:", error.code);
      console.error("RoomList: Error message:", error.message);
      
      if (error.code === 'permission-denied') {
        toast({ 
          variant: 'destructive', 
          title: 'Permission denied', 
          description: 'Please check your Firestore security rules. You need write access to the "rooms" collection.'
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Error creating room', 
          description: error.message || 'Please try again.'
        });
      }
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleJoinAndSelectRoom = async (room: Room) => {
    if (!user) return;
    
    // Always select the room first for immediate UI feedback
    onSelectRoom(room);

    // If user is not a member, check if they can join
    if (!room.members.includes(user.uid)) {
        const isPublic = room.isPublic !== false; // Default to true for backwards compatibility
        const isInvited = room.invitedUsers?.includes(user.uid) || false;
        
        // Only allow joining if room is public or user is invited
        if (!isPublic && !isInvited) {
          toast({ 
            variant: 'destructive', 
            title: 'Cannot join room', 
            description: 'This is a private room. You need to be invited to join.'
          });
          return;
        }
        
        try {
            const username = user.displayName || user.email?.split('@')[0] || 'User';
            const roomRef = doc(db, 'rooms', room.id);
            console.log('RoomList: Joining room', room.id, 'as user', user.uid);
            
            const updateData: any = {
                members: arrayUnion(user.uid),
                memberUsernames: arrayUnion(username)
            };
            
            // Remove from invited list if they were invited
            if (isInvited && room.invitedUsers) {
              updateData.invitedUsers = arrayRemove(user.uid);
            }
            
            await updateDoc(roomRef, updateData);
            console.log('RoomList: Successfully joined room');
            toast({ title: `Joined #${room.name}`});
        } catch (error: any) {
            console.error("RoomList: Error joining room:", error);
            console.error("RoomList: Error code:", error.code);
            if (error.code === 'permission-denied') {
              toast({ 
                variant: 'destructive', 
                title: 'Permission denied', 
                description: 'You do not have permission to join this room.'
              });
            } else {
              toast({ 
                variant: 'destructive', 
                title: 'Error joining room', 
                description: error.message || 'Please try again.'
              });
            }
        }
    }
  };

  const handleLeaveRoom = async (room: Room) => {
    if (!user) return;
    
    // Can't leave DM rooms
    if (room.isDM) {
      toast({
        variant: 'destructive',
        title: 'Cannot leave',
        description: 'You cannot leave direct message rooms.',
      });
      return;
    }
    
    // Can't leave if you're the creator
    const isCreator = room.createdBy === user.uid || 
      (!room.createdBy && room.members.length > 0 && room.members[0] === user.uid);
    
    if (isCreator) {
      toast({
        variant: 'destructive',
        title: 'Cannot leave',
        description: 'Room creators cannot leave their own rooms. Delete the room instead.',
      });
      return;
    }
    
    if (!confirm(`Are you sure you want to leave "${room.name}"?`)) {
      return;
    }

    try {
      const username = user.displayName || user.email?.split('@')[0] || 'User';
      const roomRef = doc(db, 'rooms', room.id);
      await updateDoc(roomRef, {
        members: arrayRemove(user.uid),
        memberUsernames: arrayRemove(username)
      });
      
      toast({
        title: 'Left room',
        description: `You have left "${room.name}".`,
      });

      // Clear active room if it was the one we left
      if (activeRoomId === room.id) {
        const remainingRooms = [...publicRooms.filter(r => r.id !== room.id), ...dmRooms.filter(r => r.id !== room.id)];
        if (remainingRooms.length > 0) {
          onSelectRoom(remainingRooms[0]);
        } else {
          onSelectRoom({ id: '', name: '', members: [], isDM: false });
        }
      }
    } catch (error: any) {
      console.error('RoomList: Error leaving room:', error);
      toast({
        variant: 'destructive',
        title: 'Error leaving room',
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!user) return;
    
    // Check if user is creator: either by createdBy field, or if createdBy is missing, check if user is first member
    const isCreator = room.createdBy === user.uid || 
      (!room.createdBy && room.members.length > 0 && room.members[0] === user.uid);
    
    if (!isCreator) {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'Only the room creator can delete this room.',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${room.name}"? This will delete all messages in this room.`)) {
      return;
    }

    try {
      // Delete all messages in the room first
      const messagesRef = collection(db, `rooms/${room.id}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the room
      await deleteDoc(doc(db, 'rooms', room.id));
      
      toast({
        title: 'Room deleted',
        description: `"${room.name}" has been deleted.`,
      });

      // Clear active room if it was the deleted one
      if (activeRoomId === room.id) {
        const remainingRooms = [...publicRooms.filter(r => r.id !== room.id), ...dmRooms.filter(r => r.id !== room.id)];
        if (remainingRooms.length > 0) {
          onSelectRoom(remainingRooms[0]);
        }
      }
    } catch (error: any) {
      console.error('RoomList: Error deleting room:', error);
      toast({
        variant: 'destructive',
        title: 'Error deleting room',
        description: error.message || 'Please try again.',
      });
    }
  };

  const RoomButton = ({ room, isDM }: { room: Room, isDM: boolean}) => {
    // Check if user is creator: either by createdBy field, or if createdBy is missing, check if user is first member
    const isCreator = !isDM && user && (
      room.createdBy === user.uid || 
      (!room.createdBy && room.members.length > 0 && room.members[0] === user.uid)
    );
    
    const isMember = user && room.members.includes(user.uid);
    const isPublic = room.isPublic !== false; // Default to true for backwards compatibility
    const isInvited = room.invitedUsers?.includes(user?.uid || '') || false;
    
    // Debug logging
    if (!isDM && user) {
      console.log(`RoomList: Room "${room.name}" - createdBy: ${room.createdBy}, user.uid: ${user.uid}, firstMember: ${room.members[0]}, isCreator: ${isCreator}`);
    }
    
    return (
      <div className="flex items-center group/room-item">
        <Button
          onClick={() => isDM ? onSelectRoom(room) : handleJoinAndSelectRoom(room)}
          variant="ghost"
          className={cn(
            'flex-1 justify-start text-left h-auto py-2 px-2',
            room.id === activeRoomId ? 'bg-accent text-accent-foreground' : ''
          )}
        >
          {isDM ? (
            <span className='mr-2'>@</span>
          ) : (
            <>
              {isPublic ? (
                <Globe className="mr-2 h-4 w-4 flex-shrink-0" />
              ) : (
                <Lock className="mr-2 h-4 w-4 flex-shrink-0" />
              )}
            </>
          )}
          <span className="truncate">{room.name}</span>
          {!isDM && !isPublic && !isMember && isInvited && (
            <span className="ml-2 text-xs text-muted-foreground">(invited)</span>
          )}
        </Button>
        {!isDM && isMember && !isCreator && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleLeaveRoom(room);
            }}
            title="Leave room"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
        {isCreator && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRoom(room);
            }}
            title="Delete room"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-background p-2 flex flex-col border-r">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-lg font-semibold text-primary">Chats</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new room</DialogTitle>
              <DialogDescription>
                Enter a name for your new chat room and choose its privacy setting.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input 
                placeholder="e.g. #gaming" 
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="room-privacy" className="flex-1">
                  <div className="flex items-center gap-2">
                    {isPublicRoom ? (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Public Room</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Private Room</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPublicRoom 
                      ? 'Everyone can see and join this room' 
                      : 'Only invited users can see and join this room'}
                  </p>
                </Label>
                <Switch
                  id="room-privacy"
                  checked={isPublicRoom}
                  onCheckedChange={setIsPublicRoom}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateRoom} disabled={isCreating || !newRoomName.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            {dmRooms.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground px-2 pt-2 mb-1 font-semibold uppercase">Direct Messages</p>
                    <ul className="space-y-1 p-2">
                        {dmRooms.map((room) => (
                            <li key={room.id} className="flex items-center">
                              <RoomButton room={room} isDM={true} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {publicRooms.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground px-2 pt-2 mb-1 font-semibold uppercase">Public Rooms</p>
                    <ul className="space-y-1 p-2">
                    {publicRooms.map((room) => (
                        <li key={room.id} className="flex items-center">
                          <RoomButton room={room} isDM={false} />
                        </li>
                    ))}
                    </ul>
                </div>
            )}
            {dmRooms.length === 0 && publicRooms.length === 0 && (
                <p className="text-sm text-muted-foreground text-center p-4">No chats yet. Create a room or start a chat with a user!</p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
