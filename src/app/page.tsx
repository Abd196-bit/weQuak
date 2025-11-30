'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/chat/Header';
import RoomList from '@/components/chat/RoomList';
import ChatWindow from '@/components/chat/ChatWindow';
import { Skeleton } from '@/components/ui/skeleton';
import type { Room } from '@/components/chat/RoomList';
import UserList from '@/components/chat/UserList';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSelectRoom = useCallback((room: Room) => {
    setActiveRoom(room);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col bg-background text-foreground">
        <div className="flex items-center justify-between border-b p-4">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-foreground">Loading chats...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col bg-background text-foreground items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-foreground mb-4">Not logged in</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground" style={{ minHeight: '100vh' }}>
      <Header />
      <div className="flex flex-1 overflow-y-hidden border-t" style={{ minHeight: 0 }}>
        <RoomList onSelectRoom={handleSelectRoom} activeRoomId={activeRoom?.id} />
        <main className="flex flex-1 flex-col border-l border-r" style={{ minWidth: 0 }}>
          {activeRoom ? (
            <ChatWindow room={activeRoom} key={activeRoom.id} />
          ) : (
            <div className="flex h-full flex-1 items-center justify-center">
              <div className="text-center p-8">
                <p className="text-lg text-foreground mb-2">Select a chat to start quacking!</p>
                <p className="text-sm text-muted-foreground">Or create a room, or invite a user to a new chat.</p>
              </div>
            </div>
          )}
        </main>
        <UserList onSelectRoom={handleSelectRoom} activeRoom={activeRoom} />
      </div>
    </div>
  );
}
