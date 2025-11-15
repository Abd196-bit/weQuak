# Troubleshooting Guide

## Profile Picture & File Upload Not Working

If profile picture upload or file sending is not working, follow these steps:

### Step 1: Update Firebase Storage Rules

**This is the most common issue!** The Storage rules must be updated in Firebase Console.

1. Go to: https://console.firebase.google.com/project/quackhat-9232c/storage/rules
2. **Delete ALL existing rules**
3. Copy the rules from `STORAGE_RULES.txt` (lines 3-31, the rules section only)
4. Paste into the rules editor
5. Click **"Publish"** button
6. Wait for confirmation
7. Refresh your browser

### Step 2: Check Browser Console

After updating the rules, try uploading again and check the browser console (F12) for:

**For Profile Picture:**
- Look for logs starting with `Header: Starting profile picture upload...`
- Check for any error codes like `storage/unauthorized` or `storage/permission-denied`

**For File Upload:**
- Look for logs starting with `MessageInput: Uploading...`
- Check for any error codes

### Step 3: Common Error Codes

- **`storage/unauthorized`** or **`storage/permission-denied`**: 
  - Storage rules not updated correctly
  - Go back to Step 1 and make sure rules are published

- **`storage/quota-exceeded`**: 
  - Firebase Storage quota exceeded
  - Upgrade your Firebase plan or delete old files

- **`storage/object-not-found`**: 
  - File path issue
  - Check console logs for the exact path being used

### Step 4: Verify Storage is Enabled

1. Go to: https://console.firebase.google.com/project/quackhat-9232c/storage
2. Make sure Firebase Storage is enabled
3. If not, click "Get Started" and follow the setup wizard

### Step 5: Test the Features

**Test Profile Picture:**
1. Click your avatar in the header (or the camera icon)
2. Select an image file
3. Check console for upload progress
4. The picture should update immediately

**Test File Upload:**
1. Click the paperclip icon in message input
2. Select a file (image, video, or document)
3. Add a caption (optional for images)
4. Click send
5. Check console for upload progress

### Debug Information

The code now includes detailed console logging. When you try to upload:

- **Profile Picture**: Look for logs starting with `Header:`
- **File Upload**: Look for logs starting with `MessageInput:`

These logs will show:
- What file is being uploaded
- The storage path being used
- Any errors that occur
- Success confirmations

### Still Not Working?

If you've completed all steps above and it's still not working:

1. **Check the browser console** for specific error messages
2. **Verify you're logged in** - both features require authentication
3. **Check Firebase Console** - make sure Storage is enabled and rules are published
4. **Try a different file** - some file types might not be supported
5. **Check file size** - profile pictures must be < 5MB, files must be < 10MB

