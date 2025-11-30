# Quick Test Guide

## Test Each Feature

### 1. Test Message Timestamps
1. Send a new message in any chat
2. Look below the message text
3. You should see a time like "2:30 PM"
4. **If not working**: Check browser console (F12) for errors

### 2. Test Call Buttons
1. Look at the Users list (right side)
2. Find a user
3. You should see 3 icons next to their name:
   - 💬 (chat invite)
   - 📞 (phone - blue)
   - 📹 (video - green)
4. **If buttons don't show**: Hard refresh (Ctrl+Shift+R)

### 3. Test Call Notifications
1. Make sure notification permission is granted (browser will ask)
2. Keep We Quack tab open (can minimize or switch tabs)
3. Have another user call you
4. You should see a desktop notification
5. **If not working**: 
   - Check notification permission in browser settings
   - Make sure tab is open (even in background)

### 4. Test Making a Call
1. Click the phone icon (📞) next to a user
2. Browser will ask for microphone permission - click "Allow"
3. You should see "Call initiated" message
4. The other user should see incoming call notification
5. **If not working**: Check browser console for errors

## Common Issues & Fixes

### Issue: "Missing or insufficient permissions"
**Fix**: Update Firestore rules
1. Go to: https://console.firebase.google.com/project/quackhat-9232c/firestore/rules
2. Copy rules from FIRESTORE_RULES.txt (lines 3-84)
3. Paste and click "Publish"

### Issue: Call buttons not visible
**Fix**: 
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Make sure you're logged in
3. Make sure there are other users in the list

### Issue: Timestamps not showing
**Fix**:
1. Send a new message - timestamps should appear
2. Old messages might not have timestamps if they were sent before this update
3. Check browser console for errors

### Issue: Notifications not working
**Fix**:
1. Check if permission was granted (browser settings)
2. Make sure tab is open (can be in background)
3. Try clicking the notification if it appears

## Still Not Working?

Please share:
1. **What feature** isn't working?
2. **What error** do you see? (check console with F12)
3. **What happens** when you try?


