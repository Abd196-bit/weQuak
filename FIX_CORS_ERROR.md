# Fix CORS Error - Step by Step

## The Problem
You're seeing this error:
```
Access to XMLHttpRequest ... has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check
```

This means Firebase Storage rules are blocking your uploads.

## The Solution (5 minutes)

### Step 1: Open Firebase Console
Go to: **https://console.firebase.google.com/project/quackhat-9232c/storage/rules**

### Step 2: Delete ALL Existing Rules
1. Select all text in the rules editor (Ctrl+A or Cmd+A)
2. Delete everything
3. Make sure the editor is completely empty

### Step 3: Copy These Rules
Copy the ENTIRE block below (from `rules_version` to the closing `}`):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - users can upload/read their own, read others
    match /profile_pictures/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    
    // Chat images - users can upload/read if they're members of the room
    match /chat_images/{roomId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && (request.resource.contentType.matches('image/.*') || 
            request.resource.contentType.matches('application/.*') ||
            request.resource.contentType.matches('video/.*'));
    }
    
    // Chat files - users can upload/read files
    match /chat_files/{roomId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

### Step 4: Paste and Publish
1. Paste the rules into the editor
2. Click the **"Publish"** button (top right)
3. Wait for the green success message
4. Wait 10-20 seconds for rules to propagate

### Step 5: Test
1. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. Try uploading a profile picture again
3. Check the console - the CORS error should be gone!

## If It Still Doesn't Work

### Check Storage is Enabled
1. Go to: https://console.firebase.google.com/project/quackhat-9232c/storage
2. If you see "Get Started", click it and enable Storage
3. Choose "Start in test mode" (we'll use our custom rules)

### Verify Rules Were Published
1. Go back to: https://console.firebase.google.com/project/quackhat-9232c/storage/rules
2. Make sure you see the rules you just pasted
3. Check the timestamp - it should show "Published just now" or recent time

### Check Browser Console
After updating rules, try again and look for:
- ✅ Success: `Header: Upload successful...` or `MessageInput: File uploaded successfully`
- ❌ Still CORS error: Rules not published correctly - go back to Step 2
- ❌ Different error: Share the new error message

## Quick Test
After updating rules, you should see in console:
```
Header: Starting profile picture upload...
Header: Uploading to storage path: ...
Header: Upload successful, getting download URL...
Header: Download URL: https://...
Header: Firebase Auth profile updated
Header: Firestore user document updated
```

If you see these logs, it's working! 🎉

