import React, { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from './screens/LoginScreen';
import TrackScreen from './screens/TrackScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import SplashScreen from './components/SplashScreen';
import { Theme } from './theme';
import { TrackingProvider, useTracking } from './contexts/TrackingContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Init step builder for SplashScreen ───
interface InitStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

type BootPhase = 'core' | 'firebase' | 'auth' | 'done';

const buildBootSteps = (bootPhase: BootPhase, bootDone: boolean): InitStep[] => {
  const phases: { id: string; label: string; phase: BootPhase }[] = [
    { id: 'core', label: 'Initializing core engine', phase: 'core' },
    { id: 'firebase', label: 'Connecting to Firebase', phase: 'firebase' },
    { id: 'auth', label: 'Restoring session', phase: 'auth' },
    { id: 'ready', label: 'Preparing interface', phase: 'done' },
  ];

  const phaseOrder: BootPhase[] = ['core', 'firebase', 'auth', 'done'];
  const currentIdx = phaseOrder.indexOf(bootPhase);

  return phases.map((p) => {
    const pIdx = phaseOrder.indexOf(p.phase);
    let status: InitStep['status'] = 'pending';
    if (pIdx < currentIdx) status = 'done';
    else if (pIdx === currentIdx) status = bootDone ? 'done' : 'active';
    return { id: p.id, label: p.label, status };
  });
};

/**
 * MainTabsContent — Inner shell that waits for TrackingContext hydration.
 */
const MainTabsContent = () => {
  const { isLoaded } = useTracking();
  const { bootPhase, bootDone } = useAuth();

  if (!isLoaded) {
    return (
      <SplashScreen
        steps={[
          { id: 'core', label: 'Core engine initialized', status: 'done' },
          { id: 'firebase', label: 'Firebase connected', status: 'done' },
          { id: 'auth', label: 'Session restored', status: 'done' },
          { id: 'data', label: 'Loading user data...', status: 'active' },
          { id: 'ready', label: 'Launching interface', status: 'pending' },
        ]}
      />
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Track') iconName = focused ? 'navigate' : 'navigate-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopColor: Theme.colors.border,
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Track" component={TrackScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const MainTabs = ({ route }: any) => {
  const { userId } = route.params;
  return (
    <TrackingProvider userId={userId}>
      <MainTabsContent />
    </TrackingProvider>
  );
};

/**
 * AppShell — Routes based on auth state from AuthContext.
 */
const AppShell: React.FC = () => {
  const { user, bootPhase, bootDone, configError } = useAuth();

  // Still booting → SplashScreen
  if (!bootDone) {
    return (
      <SplashScreen
        steps={buildBootSteps(bootPhase, bootDone)}
        errorMessage={configError}
      />
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen
            name="Main"
            component={MainTabs}
            initialParams={{ userId: user.uid }}
          />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

/**
 * App — Root. Wraps everything in AuthProvider.
 */
const App: React.FC = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
