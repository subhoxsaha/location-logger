# Expo Go Quick Start

This app is now configured to run with **Expo**, which makes development easier!

## Quick Start (Fastest Way)

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Start Expo
```bash
npm start
```

### 3. Run on Device/Simulator
- **Android**: Press `a` or open on Android Emulator
- **iOS**: Press `i` or open on iOS Simulator  
- **Web**: Press `w` for web preview
- **Expo Go**: Scan the QR code with the Expo Go app (free mobile app)

## What Changed

✅ Switched from bare React Native to Expo managed workflow
✅ Replaced platform-specific commands with Expo commands
✅ Added location/network libraries from Expo ecosystem
✅ Added EAS (Expo Application Services) for easier builds
✅ Updated `app.json` with complete Expo configuration

## Next Steps

1. Install the Expo Go app on your phone (iOS/Android)
2. Run `npm start` and scan the QR code to test on your actual device
3. Configure Firebase credentials in `.env`
4. Update app icons/splash screens in the `assets/` folder
5. Customize permissions in `app.json` as needed

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build APK/IPA
eas build --platform android    # Android
eas build --platform ios        # iOS

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

## Support

- Expo Docs: https://docs.expo.dev
- Expo Community: https://github.com/expo/expo
- Firebase + Expo: https://docs.expo.dev/guides/using-firebase/
