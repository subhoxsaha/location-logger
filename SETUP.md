# Setup Guide - Location Tracker App

## Prerequisites

- **Node.js**: v16+ (check with `node --version`)
- **npm/yarn**: Latest version
- **Android Studio** or **Xcode** for mobile development
- **Firebase Project**: https://console.firebase.google.com
- **Google Cloud Project**: For OAuth credentials

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Fill in project name (e.g., "LocationTracker")
4. Enable Google Analytics (optional)
5. Create the project

### 1.2 Add Android App
1. In Firebase Console, click "Android" under "Get started by adding Firebase to your app"
2. Package name: `com.locationtracker` (or your choice)
3. Debug SHA-1: Get from `./gradlew signingReport` in android folder
4. Download `google-services.json`
5. Place in `android/app/` directory

### 1.3 Add iOS App
1. Click "iOS" in Firebase Console
2. Bundle ID: `com.locationtracker` (or your choice)
3. Download `GoogleService-Info.plist`
4. Add to Xcode project

### 1.4 Enable Authentication
1. Go to **Authentication** section
2. Enable **Google** provider
3. Configure OAuth consent screen:
   - App name: "Location Tracker"
   - Support email: Your email
   - Developer contact: Your email

### 1.5 Setup Firestore Database
1. Go to **Firestore Database**
2. Click "Create Database"
3. Select region (closest to you)
4. Start in **Test mode** (change later for production)

### 1.6 Firestore Security Rules
Replace default rules with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /locations/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

## Step 2: Google OAuth Configuration

### 2.1 Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Android" for Android app
6. Enter package name: `com.locationtracker`
7. Enter SHA-1 from Step 1.2
8. Create credentials
9. Copy the Client ID

### 2.2 Web Client ID (for development)
1. Create another OAuth 2.0 Client ID
2. Choose "Web application"
3. Add authorized redirect URIs:
   - `http://localhost:8080`
   - `http://localhost:3000`
4. Copy the Client ID

## Step 3: Environment Configuration

### 3.1 Create .env File
```bash
cp .env.example .env
```

### 3.2 Fill in Credentials
Edit `.env` with your Firebase and Google credentials:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_from_firebase
REACT_APP_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=yourproject
REACT_APP_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:android:abcdef...

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com

# Debug Configuration
REACT_APP_DEBUG_MODE=false
REACT_APP_LOG_LEVEL=info
```

Find these values in:
- Firebase Console → Project Settings
- Google Cloud Console → Credentials

## Step 4: Install Dependencies

```bash
# Install npm packages
npm install

# Install iOS pods (if on Mac)
cd ios && pod install && cd ..
```

## Step 5: Android Configuration

### 5.1 Configure gradle.properties
Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m

# Android SDK
android.useAndroidX=true
android.enableJetifier=true

# Gradle
org.gradle.daemon=true
org.gradle.parallel=true
```

### 5.2 Add Google Services Plugin
Ensure `android/build.gradle` includes:
```gradle
dependencies {
  classpath 'com.google.gms:google-services:4.3.15'
}
```

### 5.3 Configure App build.gradle
Ensure `android/app/build.gradle` includes:
```gradle
apply plugin: 'com.google.gms.google-services'
```

## Step 6: iOS Configuration (Mac only)

### 6.1 Add GoogleService-Info.plist
1. Open `ios/LocationTracker.xcworkspace` in Xcode
2. Add `GoogleService-Info.plist` to project
3. Add to LocationTracker target

### 6.2 Update Info.plist
Add location permissions:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to track it accurately</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Background location tracking requires this permission</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location for tracking</string>
```

### 6.3 Build Settings
Ensure FirebaseCore is properly linked in build phases

## Step 7: Run the App

### Android
```bash
# Build and install
npm run android

# Or manually
cd android && ./gradlew clean && cd ..
npm run android
```

### iOS
```bash
# Build and install
npm run ios

# Or manually
cd ios && pod install && cd ..
npm run ios
```

### Development Server
```bash
npm start

# Reload app with R+R (Android) or Cmd+R (iOS)
```

## Step 8: Verify Installation

1. **Login Screen**
   - Google Sign-In button should appear
   - Anonymous option available

2. **Authentication**
   - Test Google Sign-In with valid account
   - Check Firebase Console for authenticated user

3. **Location Tracking**
   - Grant location permissions when prompted
   - Check "Get Location" works
   - Verify location appears on screen

4. **Debug Panel**
   - Open debug panel (🔧 button)
   - Check logs are appearing
   - Verify storage records are saved

5. **Cloud Sync**
   - Enable online mode
   - Click "Sync to Cloud"
   - Check Firestore in Firebase Console

## Troubleshooting

### Gradle Build Fails
```bash
cd android
./gradlew clean
./gradlew build
cd ..
```

### Pod Installation Issues
```bash
cd ios
rm -rf Pods
rm Podfile.lock
pod install
cd ..
```

### Metro Bundler Issues
```bash
npm start --reset-cache
```

### Permission Errors
- Android: Check `AndroidManifest.xml` has required permissions
- iOS: Check `Info.plist` has location permissions

### Firebase Connection Issues
- Verify `.env` credentials match Firebase Console
- Check internet connection
- Clear app cache
- Reinstall app

## Production Deployment

### Before Release
1. Change debug mode: `REACT_APP_DEBUG_MODE=false`
2. Set log level: `REACT_APP_LOG_LEVEL=error`
3. Update Firebase security rules (remove test mode)
4. Generate signed APK/IPA
5. Test thoroughly

### Android Release
```bash
cd android
./gradlew assembleRelease
```

### iOS Release
Use Xcode: Product → Archive → Upload to App Store

## Support Resources

- [React Native Docs](https://reactnative.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Google Sign-In](https://developers.google.com/identity)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

---

**Last Updated**: April 2024
