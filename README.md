# 🛰️ Location Tracker Pro

[![Build Status](https://img.shields.io/badge/Build-Success-brightgreen?style=for-the-badge&logo=expo)](https://expo.dev)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)](https://github.com/subhoxsaha/location-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Android-green?style=for-the-badge&logo=android)](https://www.android.com/)

**Location Tracker Pro** is a professional-grade, hybrid location tracking engine for Android. It is designed for maximum resilience, seamlessly transitioning between **High-Accuracy GPS** and **Intelligent WiFi Triangulation** to maintain a persistent location state in any environment.

---

## 🚀 All App Functionalities

### 📍 Advanced Tracking Engine
*   **Dual-Mode Orchestration**: Intelligent switching between Online (GPS) and Offline (WiFi) modes.
*   **Precision GPS**: High-accuracy satellite positioning with configurable polling intervals.
*   **WiFi Triangulation**: Estimating coordinates via RSSI weighted signal analysis of nearby access points.
*   **Smart Learning System**: Automatically maps and caches BSSID coordinates during active GPS fixes to improve future offline accuracy.
*   **Path Visualization**: Real-time drawing of polylines on the map as you move.

### 🔐 Security & Identity
*   **Firebase Authentication**: Secure user management supporting Email/Password and Anonymous sessions.
*   **Protected Cloud Storage**: Per-user data isolation in Firestore using strict security rules.
*   **Encrypted Storage**: Local telemetry is stored securely using AsyncStorage.

### 📊 Data Management & Sync
*   **Local-First Database**: Immediate logging to local storage to prevent data loss in dead-zones.
*   **Manual Cloud Sync**: Batch-uploading of local records to Firestore with "synced" state tracking.
*   **History Viewer**: Interactive archive of all previous tracking sessions.
*   **Remote Record Management**: Ability to view, manage, and delete cloud records directly from the app.

### 🛠️ Professional Debug & Config
*   **Real-time Log Monitoring**: In-app console for monitoring system events and errors.
*   **System Telemetry**: Track record counts, storage usage, and authentication state.
*   **Configuration Control**: Fine-tune tracking intervals (5s to 1h) and local storage limits (up to 10k records).
*   **Radar Splash Sequence**: Premium animated boot sequence with a radar-inspired UI.

### 🗺️ Interactive Mapping
*   **WebView Bridge**: High-performance Leaflet.js map with zero-flicker re-renders.
*   **Dynamic Markers**: Real-time movement updates with smooth `flyTo` animations.
*   **Bounds Management**: Automatically fits the map view to contain the entire current tracking path.

---

## 🛠️ Technical Stack

*   **Core**: React Native (Expo SDK 51)
*   **Logic**: TypeScript (Strict)
*   **Services**: Firebase (Auth/Firestore), Expo Location, Expo Task Manager
*   **UI**: Custom Dark Theme (Glassmorphism & High-Contrast Typography)
*   **Mapping**: Leaflet.js + HTML5 WebView Bridge

---

## 🏁 Getting Started

### 1. Prerequisites
*   Node.js 18+
*   Java 17 & Android SDK

### 2. Environment Setup
Rename `.env.example` to `.env` and populate your Firebase credentials:
```env
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_id
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 3. Running the Project
```bash
# Install dependencies
npm install

# Start development
npx expo start

# Build for Production (EAS)
eas build -p android --profile preview
```

---

## 👨‍💻 Author

**Subho** - [GitHub](https://github.com/subhoxsaha)

---

**Version**: 1.0.0  
**Status**: Stable Production Build  
