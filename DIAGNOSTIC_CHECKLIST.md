# Diagnostic Checklist - What's Not Working?

Please check the following and let me know which ones are failing:

## 1. Message Timestamps
- [ ] Do you see timestamps below messages? (e.g., "2:30 PM")
- [ ] Are timestamps showing for old messages?
- [ ] Are timestamps showing for new messages?

**If timestamps aren't showing:**
- Check browser console (F12) for errors
- Make sure messages have a `timestamp` field in Firestore

## 2. Call Buttons
- [ ] Do you see phone and video icons next to users in the Users list?
- [ ] When you click the phone icon, does anything happen?
- [ ] When you click the video icon, does anything happen?

**If buttons don't appear:**
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check if you're logged in
- Check if there are other users in the list

## 3. Call Notifications
- [ ] Did your browser ask for notification permission?
- [ ] Did you click "Allow" for notifications?
- [ ] When someone calls you, do you see a desktop notification?

**If notifications don't work:**
- Check browser notification settings
- Make sure the We Quack tab is open (can be in background)
- Check browser console for errors

## 4. Permission Errors
- [ ] Do you see "Missing or insufficient permissions" errors?
- [ ] Where do you see this error? (Console, screen, etc.)

**If you see permission errors:**
- Update Firestore rules (see FIRESTORE_RULES.txt)
- Update Storage rules (see STORAGE_RULES.txt)

## 5. Calls Not Connecting
- [ ] When you click call, does it show "Call initiated"?
- [ ] Does the other user see an incoming call?
- [ ] Can you answer/reject calls?

**If calls don't work:**
- Check browser console for errors
- Make sure both users have updated Firestore rules
- Check if camera/microphone permissions are granted

---

## Quick Fixes

### If NOTHING is working:
1. **Hard refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Clear browser cache**: Settings → Clear browsing data
3. **Check console**: Press F12, look for red errors
4. **Update Firebase rules**: Both Firestore and Storage

### If specific features aren't working:

**Timestamps:**
- Check if messages in Firestore have `timestamp` field
- Check browser console for timestamp errors

**Call buttons:**
- Make sure you're logged in
- Make sure there are other users
- Hard refresh the page

**Notifications:**
- Grant notification permission when prompted
- Check browser notification settings
- Make sure tab is open (even in background)

**Calls:**
- Update Firestore rules (calls collection)
- Grant camera/microphone permissions
- Check browser console for WebRTC errors

---

## What to Share

If it's still not working, please share:
1. **What specifically isn't working?** (timestamps, calls, notifications, etc.)
2. **Any error messages?** (from console or screen)
3. **What happens when you try?** (nothing, error, etc.)
4. **Browser and OS?** (Chrome on Windows, Safari on Mac, etc.)


