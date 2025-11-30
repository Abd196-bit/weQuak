'use client';

import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

interface MessageListProps {
  roomId: string;
}

export default function MessageList({ roomId }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfilePictures, setUserProfilePictures] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    const messagesRef = collection(db, `rooms/${roomId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const newMessages: Message[] = [];
      const userIds = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const messageData: Message = { 
          id: doc.id, 
          text: data.text || '',
          userId: data.userId || '',
          username: data.username || 'Unknown',
          timestamp: data.timestamp || null,
          imageUrl: data.imageUrl,
          imageWidth: data.imageWidth,
          imageHeight: data.imageHeight,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
        };
        newMessages.push(messageData);
        userIds.add(messageData.userId);
      });
      
      setMessages(newMessages);
      
      // Fetch profile pictures for all unique users
      const profilePictures: Record<string, string> = {};
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.profilePictureUrl) {
                profilePictures[userId] = userData.profilePictureUrl;
              }
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        })
      );
      setUserProfilePictures(prev => ({ ...prev, ...profilePictures }));
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
                  <AvatarImage src={userProfilePictures[message.userId]} alt={message.username} />
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
                {message.timestamp && (
                  <p className={cn(
                    "text-xs mt-1 opacity-70",
                    isCurrentUser ? "text-right" : "text-left"
                  )}>
                    {(() => {
                      try {
                        if (message.timestamp?.seconds) {
                          return new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                        } else if (message.timestamp instanceof Date) {
                          return message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                        }
                        return '';
                      } catch (error) {
                        console.error('Error formatting timestamp:', error);
                        return '';
                      }
                    })()}
                  </p>
                )}
                {message.imageUrl && (
                    <div className='mt-2'>
                        <Image 
                            src={message.imageUrl} 
                            alt="uploaded image" 
                            width={message.imageWidth || 300}
                            height={message.imageHeight || 200}
                            className='rounded-md object-cover max-w-full'
                            unoptimized
                        />
                    </div>
                )}
                {message.fileUrl && !message.imageUrl && (
                    <div className='mt-2'>
                        <a 
                            href={message.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm underline flex items-center gap-2"
                        >
                            <span>📎 {message.fileName || 'Download file'}</span>
                            {message.fileSize && (
                                <span className="text-xs opacity-75">
                                    ({(message.fileSize / 1024).toFixed(1)} KB)
                                </span>
                            )}
                        </a>
                    </div>
                )}
              </div>
              {isCurrentUser && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || userProfilePictures[user?.uid || '']} alt={user?.displayName || 'You'} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
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
