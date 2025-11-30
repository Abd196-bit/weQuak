'use client';

import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Loader2, Paperclip, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendSMSNotification } from '@/lib/smsNotifications';

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
      const maxSize = selectedFile.type.startsWith('image/') ? 10 * 1024 * 1024 : 10 * 1024 * 1024; // 10MB limit
      if (selectedFile.size > maxSize) {
        toast({ variant: 'destructive', title: 'File is too large', description: `Please select a file smaller than ${maxSize / (1024 * 1024)}MB.`});
        return;
      }
      setFile(selectedFile);
      // Only set message to filename if it's not an image (images can have captions)
      if (!selectedFile.type.startsWith('image/')) {
        setMessage(selectedFile.name);
      }
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

      if (file && file.type.startsWith('image/')) {
        console.log('MessageInput: Uploading image file:', file.name, 'type:', file.type);
        try {
          const storageRef = ref(storage, `chat_images/${roomId}/${Date.now()}_${file.name}`);
          console.log('MessageInput: Storage path:', `chat_images/${roomId}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          console.log('MessageInput: Image uploaded successfully');
          imageUrl = await getDownloadURL(snapshot.ref);
          console.log('MessageInput: Image URL:', imageUrl);

          const img = new Image();
          img.src = URL.createObjectURL(file);
          await new Promise((resolve, reject) => {
              img.onload = () => {
                  imageWidth = img.width;
                  imageHeight = img.height;
                  URL.revokeObjectURL(img.src);
                  resolve(null);
              };
              img.onerror = () => {
                  URL.revokeObjectURL(img.src);
                  reject(new Error('Failed to load image'));
              };
          });
        } catch (uploadError: any) {
          console.error('MessageInput: Error uploading image:', uploadError);
          console.error('MessageInput: Error code:', uploadError.code);
          throw uploadError;
        }
      } else if (file) {
        console.log('MessageInput: Uploading non-image file:', file.name, 'type:', file.type);
        try {
          const storageRef = ref(storage, `chat_files/${roomId}/${Date.now()}_${file.name}`);
          console.log('MessageInput: Storage path:', `chat_files/${roomId}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          console.log('MessageInput: File uploaded successfully');
          const fileUrl = await getDownloadURL(snapshot.ref);
          console.log('MessageInput: File URL:', fileUrl);
          
          const messageData: any = {
            text: message.trim() || file.name,
            timestamp: serverTimestamp(),
            userId: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'User',
            fileUrl: fileUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          };
          
          await addDoc(messagesRef, messageData);
          console.log('MessageInput: Message with file sent successfully');
          
          setMessage('');
          setFile(null);
          if(fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setIsSending(false);
          return;
        } catch (uploadError: any) {
          console.error('MessageInput: Error uploading file:', uploadError);
          console.error('MessageInput: Error code:', uploadError.code);
          throw uploadError;
        }
      }

      const messageData: any = {
        text: file ? (message.trim() || file.name) : message.trim(),
        timestamp: serverTimestamp(),
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'User',
      };

      // Only include image fields if an image was uploaded
      if (imageUrl) {
        messageData.imageUrl = imageUrl;
        messageData.fileName = file!.name;
        messageData.fileType = file!.type;
        if (imageWidth) messageData.imageWidth = imageWidth;
        if (imageHeight) messageData.imageHeight = imageHeight;
      }

      console.log('MessageInput: Sending message with data:', messageData);
      await addDoc(messagesRef, messageData);
      console.log('MessageInput: Message sent successfully');
      
      // Send SMS notifications for DM rooms
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (roomDoc.exists()) {
          const roomData = roomDoc.data();
          if (roomData.isDM && roomData.members) {
            // Find the other member(s) in the DM
            const otherMembers = roomData.members.filter((memberId: string) => memberId !== user.uid);
            const senderUsername = user.displayName || user.email?.split('@')[0] || 'Someone';
            const messageText = messageData.text || (file ? `Sent a ${file.type.startsWith('image/') ? 'photo' : 'file'}` : 'Sent a message');
            
            // Send SMS to each other member
            for (const recipientId of otherMembers) {
              await sendSMSNotification(recipientId, senderUsername, messageText, roomId);
            }
          }
        }
      } catch (smsError) {
        // Don't fail message sending if SMS fails
        console.error('MessageInput: Error sending SMS notification:', smsError);
      }
      
      setMessage('');
      setFile(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
        console.error('MessageInput: Error sending message:', error);
        console.error('MessageInput: Error code:', error.code);
        console.error('MessageInput: Error message:', error.message);
        
        let errorMessage = 'Please try again.';
        if (error.code === 'storage/unauthorized' || error.code === 'storage/permission-denied') {
          errorMessage = 'Storage permission denied. Please check your Firebase Storage rules.';
        } else if (error.code === 'storage/quota-exceeded') {
          errorMessage = 'Storage quota exceeded. Please contact support.';
        } else if (error.code === 'permission-denied') {
          errorMessage = 'Permission denied. Please check your Firestore rules.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
            variant: 'destructive',
            title: 'Failed to send message',
            description: errorMessage
        });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="border-t p-4 bg-background">
      {file && (
        <div className="mb-2 p-2 bg-muted rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Paperclip className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm truncate">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setFile(null);
              setMessage('');
              if(fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            disabled={isSending}
            title="Remove file"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button 
          type='button' 
          variant='ghost' 
          size='icon' 
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
        />
        <Input
          placeholder={file ? (file.type.startsWith('image/') ? "Add a caption (optional)..." : "Add a message...") : "Type your message or select a file..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending}
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
