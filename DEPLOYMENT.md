# Deployment Guide

This guide will help you deploy your Next.js chat application to the web.

## Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is made by the creators of Next.js and offers the easiest deployment experience.

### Steps:

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Sign up/Login to Vercel**:
   - Go to https://vercel.com
   - Sign up with your GitHub account

3. **Import your project**:
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

4. **Configure Environment Variables**:
   - In the project settings, go to "Environment Variables"
   - Add all your Firebase environment variables:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - Copy the values from your `.env.local` file

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

6. **Update Firestore Security Rules**:
   - Make sure you've updated your Firestore rules in Firebase Console
   - Go to: https://console.firebase.google.com/project/quackhat-9232c/firestore/rules
   - Copy the rules from `FIRESTORE_RULES.txt`

---

## Option 2: Deploy to Firebase Hosting

Since you're already using Firebase, you can deploy to Firebase Hosting.

### Steps:

1. **Install Firebase CLI** (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project: `quackhat-9232c`
   - What do you want to use as your public directory? `out` (for static export) or `.next` (for server-side)
   - Configure as a single-page app? `No`
   - Set up automatic builds and deploys with GitHub? `No` (or Yes if you want)

4. **Build your Next.js app**:
   ```bash
   npm run build
   ```

5. **For Static Export** (if you want static hosting):
   - Update `next.config.js` to add:
     ```javascript
     output: 'export'
     ```
   - Then build: `npm run build`
   - Update `firebase.json` to point to `out` directory

6. **For Server-Side Rendering** (recommended):
   - You'll need to use Firebase App Hosting or Vercel
   - Firebase Hosting doesn't support Next.js SSR by default

7. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

---

## Option 3: Deploy to Firebase App Hosting (Best for Firebase)

Firebase App Hosting supports Next.js with full SSR capabilities.

### Steps:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize App Hosting**:
   ```bash
   firebase init apphosting
   ```
   - Select your project: `quackhat-9232c`
   - Follow the prompts

4. **Set Environment Variables**:
   - In Firebase Console → App Hosting → Your App → Environment Variables
   - Add all your `NEXT_PUBLIC_FIREBASE_*` variables

5. **Deploy**:
   ```bash
   firebase apphosting:backends:create
   firebase deploy --only apphosting
   ```

---

## Important Notes:

1. **Environment Variables**: Never commit `.env.local` to Git. Make sure it's in `.gitignore`.

2. **Firestore Rules**: Update your Firestore security rules in Firebase Console before deploying.

3. **Firebase Configuration**: Your Firebase config is already set up, just make sure environment variables are added to your hosting platform.

4. **Custom Domain** (Optional):
   - Vercel: Add domain in project settings
   - Firebase: Add domain in Firebase Console → Hosting

---

## Quick Start (Vercel - Recommended):

1. Push code to GitHub
2. Go to vercel.com and import repository
3. Add environment variables
4. Deploy
5. Done! 🎉

Your app will be live in under 5 minutes!

