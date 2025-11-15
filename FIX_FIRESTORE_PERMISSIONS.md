# Fix Firestore Permission Error

## The Problem
You're seeing this error:
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

This means Firestore rules need to be updated.

## The Solution (2 minutes)

### Step 1: Open Firestore Rules
Go to: **https://console.firebase.google.com/project/quackhat-9232c/firestore/rules**

### Step 2: Delete ALL Existing Rules
1. Select all text in the rules editor (Ctrl+A or Cmd+A)
2. Delete everything
3. Make sure the editor is completely empty

### Step 3: Copy These Rules
Copy the ENTIRE block below (from `rules_version` to the closing `}`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - authenticated users can read all, write their own
    match /users/{userId} {
      // Allow reading individual user documents and listing all users
      allow read: if request.auth != null;
      // Allow writing only to own user document
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Rooms collection
    match /rooms/{roomId} {
      // Allow reading public rooms (isDM == false) for all authenticated users
      // Allow reading DM rooms only if user is a member
      allow read: if request.auth != null && (
        resource.data.isDM == false || 
        request.auth.uid in resource.data.members
      );
      
      // Allow creating rooms if user is in the members array
      allow create: if request.auth != null && request.auth.uid in request.resource.data.members;
      
      // Allow updating rooms:
      // 1. If user is already a member, OR
      // 2. If room is public (isDM == false) - allows joining
      allow update: if request.auth != null && (
        request.auth.uid in resource.data.members ||
        resource.data.isDM == false
      );
      
      // Allow deleting rooms if user is the creator (by createdBy field) or first member (for backward compatibility)
      allow delete: if request.auth != null && (
        request.auth.uid == resource.data.createdBy ||
        (!('createdBy' in resource.data) && resource.data.members.size() > 0 && request.auth.uid == resource.data.members[0])
      );
      
      // Messages subcollection
      match /messages/{messageId} {
        // Allow reading/creating messages if user is a member of the parent room
        allow read, create: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.members;
        // Allow deleting messages (for account deletion cleanup)
        allow delete: if request.auth != null;
      }
    }
    
    // Invites collection
    match /invites/{inviteId} {
      // Allow reading individual invites if user is sender or receiver
      allow get: if request.auth != null && (request.auth.uid == resource.data.from || request.auth.uid == resource.data.to);
      // Allow listing invites - Firestore will filter results based on query conditions
      // The query in UserList filters by 'to' or 'from' matching user.uid, so this should work
      allow list: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.from;
      allow update: if request.auth != null && request.auth.uid == resource.data.to;
      // Allow deleting invites (for account deletion cleanup and canceling)
      allow delete: if request.auth != null && (request.auth.uid == resource.data.from || request.auth.uid == resource.data.to);
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
2. The permission error should be gone!
3. Users should now load in the UserList

## What Changed
- Changed `allow get` and `allow list` to `allow read` for the users collection
- This covers both individual document reads and collection queries
- More concise and works better with `onSnapshot`

## If It Still Doesn't Work

### Verify Rules Were Published
1. Go back to: https://console.firebase.google.com/project/quackhat-9232c/firestore/rules
2. Make sure you see the rules you just pasted
3. Check the timestamp - it should show "Published just now" or recent time

### Check Browser Console
After updating rules, you should see:
- ✅ `UserList: Successfully loaded X other users`
- ❌ Still permission error: Rules not published correctly - go back to Step 2

