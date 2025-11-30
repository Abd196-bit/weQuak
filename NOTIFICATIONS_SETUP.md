# Desktop Notifications Setup

## Overview
The app now supports desktop notifications for incoming calls, allowing users to receive and answer calls even when the website is in the background or minimized.

## Features

### 1. **Desktop Notifications**
- Shows a notification when an incoming call is received
- Works even when the browser tab is in the background
- Clicking the notification brings the window to focus
- Includes call type (Audio/Video) in the notification

### 2. **Message Timestamps**
- Each message now displays its timestamp
- Shows time in 12-hour format (e.g., "2:30 PM")
- Timestamps are aligned based on message sender

## How It Works

### Notification Permission
- On first visit, the browser will ask for notification permission
- Users must grant permission to receive call notifications
- Permission is requested automatically when the app loads

### Notification Behavior
- Notifications appear when an incoming call is detected
- Clicking the notification focuses the browser window
- Notifications are automatically closed when clicked
- Each call gets a unique notification tag to prevent duplicates

## Browser Support

### Desktop Notifications Work On:
- ✅ Chrome/Edge (Windows, Mac, Linux)
- ✅ Firefox (Windows, Mac, Linux)
- ✅ Safari (Mac) - with limitations
- ✅ Opera

### Mobile Support:
- ⚠️ Limited support on mobile browsers
- Mobile browsers handle notifications differently
- May require app installation for full functionality

## Setup Instructions

### For Users:
1. **Grant Notification Permission**:
   - When you first visit the site, your browser will ask for notification permission
   - Click "Allow" to enable notifications
   - If you denied permission, you can enable it in browser settings:
     - **Chrome**: Settings → Privacy and Security → Site Settings → Notifications
     - **Firefox**: Settings → Privacy & Security → Permissions → Notifications
     - **Safari**: Safari → Preferences → Websites → Notifications

2. **Using Notifications**:
   - Keep the We Quack tab open (can be in background)
   - When someone calls you, a notification will appear
   - Click the notification to open/switch to the We Quack tab
   - Answer or reject the call as usual

### For Developers:
- Notifications are handled in `src/context/CallContext.tsx`
- Permission is requested in `src/app/layout.tsx`
- Uses the Web Notifications API

## Troubleshooting

### Notifications Not Appearing:
1. **Check Permission**: Make sure notifications are allowed for the site
2. **Browser Settings**: Check if notifications are blocked globally
3. **Do Not Disturb**: Make sure your OS isn't in Do Not Disturb mode
4. **Browser Focus**: Some browsers only show notifications when tab is in background

### Permission Denied:
- Go to browser settings and manually enable notifications for the site
- Clear site data and reload to get the permission prompt again

### Notifications Work But Can't Answer:
- Make sure the We Quack tab is still open (even if in background)
- The notification brings the tab to focus, but the tab must exist
- If the tab was closed, you'll need to reopen the site

## Technical Details

### Notification API Usage:
```javascript
// Request permission
Notification.requestPermission()

// Show notification
new Notification('Title', {
  body: 'Message',
  icon: '/favicon.ico',
  requireInteraction: true,
  vibrate: [200, 100, 200]
})
```

### Message Timestamps:
- Timestamps are stored in Firestore as `timestamp` field
- Converted from Firestore timestamp to JavaScript Date
- Formatted using `toLocaleTimeString()` for user-friendly display

## Future Improvements

- [ ] Sound alerts for incoming calls
- [ ] Custom notification sounds
- [ ] Notification actions (Answer/Reject buttons in notification)
- [ ] Persistent notifications until call is answered/rejected
- [ ] Push notifications for when tab is completely closed (requires service worker)


