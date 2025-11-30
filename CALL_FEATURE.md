# Audio & Video Call Feature

## Overview
The app now supports peer-to-peer audio and video calls using WebRTC technology. Calls are initiated from the user list and use Firestore for signaling.

## Features

### 1. **Audio Calls**
- Click the phone icon (📞) next to any user to start an audio call
- Audio-only communication with mute/unmute controls

### 2. **Video Calls**
- Click the video icon (📹) next to any user to start a video call
- Full video communication with:
  - Remote video display
  - Local video (picture-in-picture)
  - Toggle video on/off
  - Mute/unmute audio

### 3. **Call Controls**
- **Mute/Unmute**: Toggle your microphone
- **Video On/Off**: Toggle your camera (video calls only)
- **End Call**: Hang up the call

### 4. **Call Management**
- Incoming call notifications
- Accept/Reject incoming calls
- Real-time call status updates
- Automatic cleanup when calls end

## How It Works

### WebRTC Architecture
1. **Signaling**: Uses Firestore to exchange WebRTC offer/answer and ICE candidates
2. **Peer Connection**: Direct peer-to-peer connection for audio/video streams
3. **Media Streams**: Uses browser's `getUserMedia` API for camera/microphone access

### Firestore Collections
- **`calls`**: Stores call signaling data
  - `callerId`: User ID of the caller
  - `receiverId`: User ID of the receiver
  - `type`: 'audio' or 'video'
  - `status`: 'ringing', 'active', 'ended', 'rejected'
  - `offer`: WebRTC offer (SDP)
  - `answer`: WebRTC answer (SDP)
  - `iceCandidates`: ICE candidates for NAT traversal

## Setup Instructions

### 1. Update Firestore Rules
The Firestore rules have been updated to include the `calls` collection. Make sure to update them in Firebase Console:

1. Go to: https://console.firebase.google.com/project/quackhat-9232c/firestore/rules
2. Copy the rules from `FIRESTORE_RULES.txt` (includes the calls collection rules)
3. Paste and click "Publish"

### 2. Browser Permissions
Users will need to grant camera and microphone permissions when:
- Starting a video call
- Starting an audio call
- Answering a call

### 3. Network Requirements
- WebRTC works best with direct peer-to-peer connections
- For users behind NAT/firewalls, STUN servers are used (Google's public STUN servers)
- For more complex network scenarios, consider adding TURN servers

## Usage

### Starting a Call
1. Find a user in the Users list
2. Click the phone icon (📞) for audio or video icon (📹) for video
3. Wait for the other user to answer

### Receiving a Call
1. When a call comes in, a full-screen call window appears
2. Click the green phone button to answer
3. Click the red phone button to reject

### During a Call
- Use the mute button to toggle your microphone
- Use the video button (video calls only) to toggle your camera
- Click the red hang-up button to end the call

## Technical Details

### Components
- **`useWebRTC` hook**: Manages WebRTC peer connections and media streams
- **`CallContext`**: Provides call state management across the app
- **`CallWindow`**: Full-screen call interface
- **`CallControls`**: Call control buttons (mute, video, hang up)

### Files Created/Modified
- `src/hooks/useWebRTC.ts` - WebRTC logic
- `src/context/CallContext.tsx` - Call state management
- `src/components/chat/CallWindow.tsx` - Call UI
- `src/components/chat/CallControls.tsx` - Call controls
- `src/components/chat/UserList.tsx` - Added call buttons
- `src/app/page.tsx` - Integrated call window
- `src/app/layout.tsx` - Added CallProvider
- `FIRESTORE_RULES.txt` - Added calls collection rules

## Limitations & Future Improvements

### Current Limitations
- Uses free STUN servers (may not work for all network configurations)
- No TURN server for complex NAT scenarios
- No call history
- No group calls (only 1-to-1)

### Potential Improvements
- Add TURN server support for better connectivity
- Call history/logs
- Group video calls
- Screen sharing
- Call recording (with user consent)
- Better error handling and reconnection logic
- Call quality indicators

## Troubleshooting

### Call Not Connecting
1. Check browser permissions for camera/microphone
2. Check Firestore rules are updated
3. Check browser console for errors
4. Try refreshing the page

### No Audio/Video
1. Grant browser permissions when prompted
2. Check device settings (camera/microphone not in use by another app)
3. Check browser console for media device errors

### Call Drops
- This can happen with poor network connectivity
- WebRTC requires stable internet connection
- Consider adding TURN servers for better reliability

## Security Notes
- All calls are peer-to-peer (not routed through servers)
- Firestore is only used for signaling (not for media)
- Users must be authenticated to make/receive calls
- Call documents are automatically cleaned up after calls end



