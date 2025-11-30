import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sends an SMS notification when someone sends a message
 * This function should be called from a Cloud Function or API endpoint
 * For now, it creates a document in Firestore that can trigger a Cloud Function
 */
export async function sendSMSNotification(
  recipientUserId: string,
  senderUsername: string,
  messageText: string,
  roomId: string
): Promise<void> {
  try {
    // Get recipient's phone number
    const recipientDoc = await getDoc(doc(db, 'users', recipientUserId));
    if (!recipientDoc.exists()) {
      console.log('SMS Notification: Recipient user not found');
      return;
    }

    const recipientData = recipientDoc.data();
    const phoneNumber = recipientData.phoneNumber;

    if (!phoneNumber) {
      console.log('SMS Notification: Recipient has no phone number');
      return;
    }

    // Create a notification document that can trigger a Cloud Function
    // The Cloud Function should listen to this collection and send SMS
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const notificationsRef = collection(db, 'sms_notifications');
    
    await addDoc(notificationsRef, {
      recipientUserId,
      recipientPhoneNumber: phoneNumber,
      senderUsername,
      messageText: messageText.substring(0, 160), // SMS limit
      roomId,
      timestamp: serverTimestamp(),
      status: 'pending',
    });

    console.log('SMS Notification: Notification queued for', phoneNumber);
  } catch (error) {
    console.error('SMS Notification: Error sending notification:', error);
    // Don't throw - SMS notifications are not critical
  }
}

