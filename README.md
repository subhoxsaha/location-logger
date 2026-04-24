# Location Tracker - Mobile App

A professional React Native mobile application for tracking user location with both online GPS and offline WiFi scanning capabilities.

## 🎯 Features

### Online Mode (GPS)
- Precise GPS location tracking when device is online
- Configurable tracking intervals (5 seconds to 1 hour)
- Automatic location updates with high accuracy
- Altitude and speed tracking

### Offline Mode (WiFi)
- WiFi network scanning for location estimation when offline
- Signal strength-based triangulation
- Fallback location determination
- Automatic WiFi database learning

### Cloud Integration
- Firebase authentication (Email/Password & Anonymous)
- Firestore cloud sync for location history
- Automatic sync when device comes online
- User data encryption and privacy

### Professional UI
- Dark mode with professional design
- Real-time status indicators
- Location display card with detailed information
- Responsive and smooth animations

### Advanced Features
- **Configuration Panel**: Customize tracking settings
- **Debug Panel**: Comprehensive debugging tools
  - Real-time log monitoring
  - Record statistics
  - System status overview
- **Location History**: View recent location records
- **Manual Sync**: Sync location data to cloud

## 📱 App Structure

```
src/
├── App.tsx                          # Main app entry point (staged boot)
├── theme.ts                         # Centralized design tokens
├── screens/
│   ├── HomeScreen.tsx              # Main tracking interface
│   ├── TrackScreen.tsx             # Live map + polling engine
│   ├── HistoryScreen.tsx           # DB archive controller
│   ├── CloudDataScreen.tsx         # Cloud record management
│   ├── SettingsScreen.tsx          # Configuration & debug
│   └── LoginScreen.tsx             # Authentication screen
├── components/
│   ├── SplashScreen.tsx            # Animated boot sequence (radar UI)
│   ├── Button.tsx                  # Custom button component
│   ├── MapComponent.tsx            # Leaflet WebView map bridge
│   ├── LocationDisplayCard.tsx     # Location details display
│   ├── ConfigurationPanel.tsx      # Settings management
│   └── DebugPanel.tsx              # Debug tools
├── contexts/
│   └── TrackingContext.tsx          # Global tracking state provider
├── services/
│   ├── firebaseConfig.ts           # Firebase initialization
│   ├── gpsLocationService.ts       # GPS tracking service
│   ├── wifiLocationService.ts      # WiFi scanning service
│   ├── firebaseService.ts          # Firestore operations
│   ├── syncService.ts              # Batch sync engine
│   ├── authService.ts              # Authentication service
│   └── storageService.ts           # Local storage management
├── utils/
│   ├── debugLogger.ts              # Logging utility
│   ├── locationManager.ts          # Location tracking orchestration
│   ├── geoUtils.ts                 # Haversine distance calculations
│   └── uuid.ts                     # Lightweight ID generator
└── types/
    └── index.ts                    # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Android Studio or Xcode
- Firebase project setup
- Google Cloud project for authentication

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd App-Dev
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your Firebase and Google credentials:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_DEBUG_MODE=false
REACT_APP_LOG_LEVEL=info
```

4. **Install Pod dependencies (iOS)**
```bash
cd ios && pod install && cd ..
```

5. **Setup Firebase**
- Create Firebase project at https://console.firebase.google.com
- Enable Authentication (Email/Password & Anonymous)
- Create Firestore database
- Copy the contents of `firestore.rules` into the "Rules" tab of your Firestore database to secure user data and prevent permission errors.
- Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

### Running the App

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Development Server:**
```bash
npm start
```

## 🔧 Configuration

### Tracking Configuration

The app includes a comprehensive configuration panel for customizing behavior:

#### Tracking Interval
- **Quick buttons**: 10s, 30s, 60s, 5min presets
- **Custom interval**: Set any value from 5 seconds to 1 hour
- Changes applied immediately

#### Location Modes
- **Online Mode**: Enable/disable GPS tracking
- **Offline Mode**: Enable/disable WiFi scanning
- Both can be used simultaneously

#### Storage Options
- **Max Records**: Limit local storage (10-10,000 records)
- Older records automatically removed when limit reached

### Debug Configuration

**Log Levels** (in `.env`):
- `DEBUG`: Verbose logging with all details
- `INFO`: Standard information level
- `WARN`: Warnings and important events
- `ERROR`: Error level only

**Debug Mode** (in `.env`):
```
REACT_APP_DEBUG_MODE=true   # Enable console logging
REACT_APP_LOG_LEVEL=debug   # Set log level
```

## 📍 Location Services

### GPS Location Service
```typescript
// Get single location
const location = await gpsService.getCurrentLocation();

// Watch continuous updates
const unsubscribe = gpsService.watchLocation(
  (location) => console.log(location),
  (error) => console.error(error)
);
```

**Features:**
- High accuracy mode
- Automatic retry with configurable delays
- Timeout handling
- Distance filtering (5m minimum)

### WiFi Location Service
```typescript
// Scan available networks
const networks = await wifiService.scanWiFiNetworks();

// Get WiFi-based location
const location = await wifiService.getWiFiLocation();

// Add WiFi location to database
await wifiService.addWiFiLocation(bssid, latitude, longitude);
```

**Features:**
- Signal strength analysis (RSSI)
- Weighted triangulation
- Network database learning
- Fallback handling

## ☁️ Firebase Integration

### Authentication
```typescript
// Email & Password Sign-In
await auth().signInWithEmailAndPassword(email, password);

// Email & Password Sign-Up
await auth().createUserWithEmailAndPassword(email, password);

// Anonymous Sign-In
await auth().signInAnonymously();
```

### Location Sync
```typescript
// Sync unsynced records to cloud
const unsynced = await storageService.getUnsyncedLocations(userId);
await FirebaseService.syncLocations(userId, unsynced);

// Retrieve location history
const history = await FirebaseService.getUserLocationHistory(userId);
```

## 🐛 Debug Tools

### Debug Panel Features

**Logs Tab**
- Real-time log display (last 20 entries)
- Color-coded by severity
- Export logs to share
- Clear logs manually

**Records Tab**
- Total stored records count
- Clear all records option
- Storage statistics

**Status Tab**
- App running status
- User ID
- Version information
- Device/storage info

### Programmatic Logging

```typescript
import { DebugLogger } from './utils/debugLogger';

const logger = new DebugLogger('MyModule');

logger.debug('Debug message', { data: 'value' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);

// Get all logs
const logs = logger.getLogs();
const allLogs = logger.getAllLogs();

// Export logs
const jsonLogs = logger.exportLogs();
```

## 📊 Architecture & Code Flow

### 1. Unidirectional Data Flow
The application strictly follows a unidirectional data flow to ensure stability and predictable state changes:
```
Settings (Interval/Rules) → LocationManager (Engine) → AsyncStorage (Local First) → TrackScreen (Map) / HistoryScreen (DB Control)
```
- **Local-First Philosophy**: All telemetry is saved exclusively to local storage (`AsyncStorage`). The polling loop **never** autonomously syncs to Firebase.
- **Database Controller**: The `HistoryScreen` acts as the sole controller for database operations (Force Sync, Cleanse, Delete).

### 2. Location Polling Engine (`LocationManager`)
The `LocationManager` is a centralized service orchestrating online and offline modes.
- **GPS Primary**: Attempts high-accuracy GPS fixes first.
- **WiFi Fallback**: If GPS fails or the device is offline, it falls back to a WiFi triangulation service.
- **Smart Learning**: Upon successful GPS fixes, the engine "teaches" the local WiFi database BSSID-to-coordinate mappings to improve future offline triangulation accuracy.

### 3. Ref-based Polling Lock
To prevent stale closure bugs and overlapping interval executions, the `TrackScreen` employs a strict ref-based polling lock:
```typescript
const isPollingRef = useRef(false);
// ... inside interval
if (isPollingRef.current) return;
isPollingRef.current = true;
try { await fetchLocation(); } finally { isPollingRef.current = false; }
```
This guarantees rhythmic, non-overlapping data extraction based on the user-configured interval.

### 4. WebView Map Bridge
To eliminate map flickering during React re-renders, the `MapComponent` uses a persistent WebView instance.
- **Static HTML**: The Leaflet map HTML is injected exactly once using `useMemo`.
- **`postMessage` Bridge**: All dynamic updates (adding markers, drawing polylines, zooming, recentering) are transmitted via a lightweight `postMessage` bridge.
- **Smooth Animations**: The map utilizes native Leaflet methods (`flyTo`, `flyToBounds`) to smoothly transition between points and bounds without jarring visual jumps.

### Auto-Sync Flow (Manual Initiation Only)
```
1. User navigates to History Screen
   ↓
2. User taps "Force Sync"
   ↓
3. App queries `AsyncStorage` for `synced: false` records
   ↓
4. Batch-uploads to Firestore
   ↓
5. Updates local records as `synced: true`
```

## 🎨 UI/UX Design

### Color Scheme (Dark Mode)
- **Background**: `#0f0f0f` (Deep Black)
- **Surface**: `#1a1a1a` (Dark Gray)
- **Primary**: `#0066cc` (Blue)
- **Success**: `#00aa00` (Green)
- **Danger**: `#cc0000` (Red)
- **Text**: `#ffffff` (White)
- **Muted**: `#aaaaaa` (Gray)

### Component Spacing
- **Standard padding**: 16px
- **Small padding**: 8-12px
- **Large padding**: 20-24px
- **Card radius**: 12px
- **Small radius**: 6-8px

## 🔐 Privacy & Security

- Location data is encrypted in transit and at rest
- Firebase security rules restrict data access
- User authentication required for cloud features
- Local data stored in secure AsyncStorage
- No data collection without user consent

## 📝 Type Definitions

```typescript
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  source: 'GPS' | 'WiFi';
  altitude?: number;
  speed?: number;
}

interface TrackingConfig {
  enabled: boolean;
  intervalSeconds: number;
  useOnlineMode: boolean;
  useOfflineMode: boolean;
  maxStorageRecords: number;
}

interface LocationRecord {
  id: string;
  location: LocationData;
  config: TrackingConfig;
  userId: string;
  synced: boolean;
  createdAt: number;
}
```

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## 📦 Build & Deploy

### Android Build
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### iOS Build
```bash
cd ios
pod install
cd ..
xcodebuild -workspace ios/LocationTracker.xcworkspace \
  -scheme LocationTracker -configuration Release
```

## 🐛 Troubleshooting

### GPS Not Working
- Check if location permission is granted
- Ensure device has GPS enabled
- Try increasing accuracy timeout in settings

### WiFi Scanning Issues
- Verify WiFi networks are available
- Check if WiFi permissions are granted
- Try manual network scan from debug panel

### Firebase Sync Issues
- Verify internet connection
- Check Firebase credentials in `.env`
- Review Firestore security rules
- Check user authentication status

### Build Errors
- Clean cache: `npm cache clean --force`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Clear Android build: `cd android && ./gradlew clean && cd ..`
- Clear iOS build: `cd ios && rm -rf Pods && pod install && cd ..`

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Contributing

Contributions are welcome! Please follow these steps:
1. Create a feature branch
2. Make your changes
3. Add tests for new features
4. Submit a pull request

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review debug logs for errors

## 🎉 Acknowledgments

Built with:
- React Native
- Firebase
- Google Sign-In
- React Navigation
- TypeScript

---

**Version**: 1.0.0  
**Last Updated**: April 2024  
**Status**: Active Development
