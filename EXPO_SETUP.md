# Expo Configuration Guide

## Environment Variables

Create a `.env` file in the root directory with:

```
FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
GOOGLE_SIGN_IN_WEB_CLIENT_ID=YOUR_GOOGLE_SIGN_IN_WEB_CLIENT_ID
```

## App Configuration

- Update `app.json` with your Google Maps API key:
  - `ios.config.googleMapsApiKey`
  - `android.config.googleMaps.apiKey`
- If you use EAS build profiles, keep the example placeholders in `eas.json` and set Firebase values via EAS secrets (recommended for production).
  - Create secrets for: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`.
  - If your EAS build needs Google Sign-In, also create `GOOGLE_SIGN_IN_WEB_CLIENT_ID` and add it to the `eas.json` env block. Keep it in `.env` for local dev.
  - Example: `eas secret:create --name FIREBASE_API_KEY --value <value>` (repeat for each).

## Getting Started with Expo

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Expo Account (Optional)
```bash
npx expo login
```

### 3. Run on Simulator/Device
```bash
# Start Expo dev server
npm start

# From the Expo menu, press:
# - 'a' for Android
# - 'i' for iOS
# - 'w' for web
# Or scan the QR code with Expo Go app
```

### 4. Build for Production
```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to app stores
eas submit --platform android
eas submit --platform ios
```

## Firebase Setup with Expo

The app uses Firebase for authentication and Firestore database. Make sure to:

1. Create a Firebase project at https://console.firebase.google.com
2. Add your Firebase config to `.env` file
3. Enable Authentication (Google Sign-In)
4. Set up Firestore Database
5. Configure iOS and Android apps in Firebase Console

## Location Permissions

iOS: Edit `app.json` to customize permission messages in the `ios.infoPlist` section
Android: Permissions are defined in `app.json` under `android.permissions`

## Troubleshooting

### Metro Bundler Issues
If you see "Unable to resolve...", clear cache:
```bash
npm start -- --clear
```

### Firebase Connection Issues
- Ensure your Firebase config in `.env` is correct
- Check that your Firebase rules allow the operations
- Verify Google Sign-In is enabled in Firebase

### Permission Errors
- Android: Grant location permission when app starts
- iOS: Check Info.plist permissions in app.json
