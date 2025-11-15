'use client';

import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { type Room } from './RoomList';

interface ChatWindowProps {
  room: Room;
}

export default function ChatWindow({ room }: ChatWindowProps) {
  const roomName = room.isDM ? `@ ${room.name}` : `# ${room.name}`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b p-4">
        <h2 className="text-xl font-bold">{roomName}</h2>
      </div>
      <MessageList roomId={room.id} />
      <MessageInput roomId={room.id} />
    </div>
  );
}
