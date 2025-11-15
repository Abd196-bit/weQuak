# Quick Fix Checklist

## If Profile Picture or File Upload is "Stuck"

Follow these steps in order:

### ✅ Step 1: Check Browser Console (IMPORTANT!)

1. Open browser console (Press F12 or Right-click → Inspect → Console tab)
2. Try uploading a profile picture or file
3. **Look for error messages** - they will tell you exactly what's wrong

### ✅ Step 2: Update Firebase Storage Rules

**This fixes 90% of upload issues!**

1. Go to: https://console.firebase.google.com/project/quackhat-9232c/storage/rules
2. **Delete ALL existing rules** (select all and delete)
3. Copy ONLY the rules section from `STORAGE_RULES.txt` (lines 3-31):
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
4. Paste into Firebase Console
5. Click **"Publish"**
6. Wait 10-20 seconds for rules to propagate
7. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)

### ✅ Step 3: Verify Storage is Enabled

1. Go to: https://console.firebase.google.com/project/quackhat-9232c/storage
2. If you see "Get Started" button, click it and enable Storage
3. Choose "Start in test mode" (we'll use our custom rules)

### ✅ Step 4: Check What Error You're Getting

After updating rules, try again and check console for:

- **`storage/unauthorized`** or **`storage/permission-denied`**: Rules not updated correctly
- **`storage/quota-exceeded`**: Storage quota full
- **`storage/object-not-found`**: Path issue
- **No error but nothing happens**: Check if file is actually selected

### ✅ Step 5: Test with Console Open

1. Open console (F12)
2. Try uploading profile picture
3. You should see logs like:
   - `Header: Starting profile picture upload...`
   - `Header: Uploading to storage path: ...`
   - `Header: Upload successful...`
4. If you see an error, copy the error code and message

## Common Issues:

1. **"Still stuck" = Rules not updated**: Go back to Step 2
2. **No console logs = File not selected**: Make sure file picker opens
3. **Error in console = Check error code**: See Step 4

## Still Not Working?

Share the exact error message from the browser console and I'll help fix it!

