'use client';

import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Loader2, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  roomId: string;
}

export default function MessageInput({ roomId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: 'destructive', title: 'File is too large', description: 'Please select a file smaller than 5MB.'});
        return;
      }
      setFile(selectedFile);
      setMessage(selectedFile.name); // Show file name in input
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() === '' && !file) || !user) return;
    setIsSending(true);

    try {
      const messagesRef = collection(db, `rooms/${roomId}/messages`);
      let imageUrl: string | undefined = undefined;
      let imageWidth: number | undefined = undefined;
      let imageHeight: number | undefined = undefined;

      if (file) {
        const storageRef = ref(storage, `chat_images/${roomId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(snapshot.ref);

        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(resolve => {
            img.onload = () => {
                imageWidth = img.width;
                imageHeight = img.height;
                URL.revokeObjectURL(img.src);
                resolve(null);
            }
        });
      }

      const messageData: any = {
        text: file ? '' : message.trim(),
        timestamp: serverTimestamp(),
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'User',
      };

      // Only include image fields if an image was uploaded
      if (imageUrl) {
        messageData.imageUrl = imageUrl;
        if (imageWidth) messageData.imageWidth = imageWidth;
        if (imageHeight) messageData.imageHeight = imageHeight;
      }

      await addDoc(messagesRef, messageData);
      
      setMessage('');
      setFile(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Failed to send message',
            description: 'Please try again.'
        });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="border-t p-4 bg-background">
      <div className="flex items-center gap-2">
        <Button 
          type='button' 
          variant='ghost' 
          size='icon' 
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif"
        />
        <Input
          placeholder="Type your message or select a file..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending || !!file}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={isSending || (message.trim() === '' && !file)}>
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </form>
  );
}
