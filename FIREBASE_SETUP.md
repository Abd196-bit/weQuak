# Firebase Setup Instructions

To run this application, you need to configure Firebase environment variables.

## Steps:

1. Create a `.env.local` file in the root directory of the project

2. Add the following environment variables with your Firebase project credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

3. To get your Firebase credentials:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Click the gear icon ⚙️ > Project Settings
   - Scroll down to "Your apps" section
   - If you don't have a web app, click "Add app" and select the web icon (</>)
   - Copy the config values from the `firebaseConfig` object

4. Replace the placeholder values in `.env.local` with your actual Firebase credentials

5. Restart the development server after creating/updating `.env.local`

## Example `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyExample123456789
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=myproject
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=myproject.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

