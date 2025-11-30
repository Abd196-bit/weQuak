'use client';

import { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { type Room } from './RoomList';
import { Button } from '@/components/ui/button';
import { UserPlus, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import UserInviteList from './UserInviteList';

interface ChatWindowProps {
  room: Room;
}

export default function ChatWindow({ room }: ChatWindowProps) {
  const roomName = room.isDM ? `@ ${room.name}` : `# ${room.name}`;
  const isPrivateRoom = !room.isDM && room.isPublic === false;
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPrivateRoom && <Lock className="h-4 w-4 text-muted-foreground" />}
          <h2 className="text-xl font-bold">{roomName}</h2>
        </div>
        {isPrivateRoom && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Users
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Users to {room.name}</DialogTitle>
                <DialogDescription>
                  Select users to invite to this private room.
                </DialogDescription>
              </DialogHeader>
              <UserInviteList room={room} onInviteComplete={() => setIsInviteDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <MessageList roomId={room.id} />
      <MessageInput roomId={room.id} />
    </div>
  );
}
