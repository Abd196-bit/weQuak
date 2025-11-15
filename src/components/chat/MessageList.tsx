'use client';

import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

interface Message {
  id: string;
  text: string;
  userId: string;
  username: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  } | null;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
}

interface MessageListProps {
  roomId: string;
}

export default function MessageList({ roomId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    const messagesRef = collection(db, `rooms/${roomId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <AnimatePresence>
        {messages.map((message) => {
          const isCurrentUser = message.userId === user?.uid;
          return (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn('flex items-end gap-2', isCurrentUser ? 'justify-end' : 'justify-start')}
            >
              {!isCurrentUser && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {message.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 flex flex-col',
                  isCurrentUser
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary text-secondary-foreground rounded-bl-none'
                )}
              >
                {!isCurrentUser && (
                  <p className="text-xs font-bold text-muted-foreground mb-1">{message.username}</p>
                )}
                {message.text && <p className="text-sm">{message.text}</p>}
                {message.imageUrl && (
                    <div className='mt-2'>
                        <Image 
                            src={message.imageUrl} 
                            alt="uploaded content" 
                            width={message.imageWidth || 300}
                            height={message.imageHeight || 200}
                            className='rounded-md object-cover'
                        />
                    </div>
                )}
              </div>
              {isCurrentUser && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
}
