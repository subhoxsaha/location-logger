import React, { useEffect, useRef, useImperativeHandle, forwardRef, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { LocationData } from '../types';

export type MapTheme = 'dark' | 'light' | 'satellite';

export interface MapRef {
  recenter: (coords?: { latitude: number; longitude: number }) => void;
  zoomOut: () => void;
  zoomStep: (delta: number) => void;
}

interface MapComponentProps {
  currentLocation: LocationData | null;
  history?: LocationData[];
  theme?: MapTheme;
  pathColor?: string;
  loading?: boolean;
  avatarUrl?: string;
}

const getTileUrl = (t: MapTheme) => {
  switch (t) {
    case 'light': return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    case 'satellite': return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    default: return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  }
};

const MapComponent = forwardRef<MapRef, MapComponentProps>(({
  currentLocation,
  history = [],
  theme = 'light',
  pathColor = '#007AFF',
  loading = false,
  avatarUrl = '',
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);

  // Helper: send message only when WebView is loaded
  const send = (type: string, data?: any) => {
    if (!isReady || !webViewRef.current) return;
    webViewRef.current.postMessage(JSON.stringify({ type, data }));
  };

  useImperativeHandle(ref, () => ({
    recenter: (coords?) => {
      if (coords) {
        send('FLY_TO', { latitude: coords.latitude, longitude: coords.longitude });
      } else {
        send('RECENTRE');
      }
    },
    zoomOut: () => {
      send('FIT_BOUNDS');
    },
    zoomStep: (delta: number) => {
      send('ZOOM_STEP', delta);
    },
  }));

  // Capture initial location for the VERY FIRST render only
  const initialLoc = useMemo(() => {
    if (currentLocation) return currentLocation;
    if (history.length > 0) return history[history.length - 1];
    return null;
  }, []); // Empty dependency ensures this only happens once on mount

  // The HTML is built ONCE. All future updates go through postMessage.
  const mapHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          * { -webkit-tap-highlight-color: transparent; }
          body { margin: 0; padding: 0; background: #f5f5f5; overflow: hidden; opacity: ${initialLoc ? 1 : 0}; transition: opacity 0.5s ease; }
          #map { height: 100vh; width: 100vw; }
          .leaflet-tile-pane { transition: opacity 0.3s ease; }
          .leaflet-overlay-pane svg { transition: opacity 0.2s ease; }
          :root {
            --marker-color: #007AFF;
          }
          .pulse-container {
            position: relative;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pulse-core {
            width: 18px;
            height: 18px;
            background: var(--marker-color);
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px var(--marker-color);
            z-index: 2;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pulse-core img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
          }
          .pulse-ring, .pulse-ring-2 {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: var(--marker-color);
            animation: ripple 2.5s cubic-bezier(0.1, 0.4, 0.8, 1) infinite;
            z-index: 1;
            opacity: 0;
          }
          .pulse-ring-2 {
            animation-delay: 1.25s;
          }
          @keyframes ripple {
            0% { transform: scale(0.6); opacity: 0.6; }
            100% { transform: scale(3.5); opacity: 0; }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            preferCanvas: true,
            zoomAnimation: true,
            markerZoomAnimation: true,
            fadeAnimation: true,
            zoomAnimationThreshold: 4,
            zoomSnap: 0.5,
            zoomDelta: 0.5,
            wheelPxPerZoomLevel: 120,
            inertia: true,
            inertiaDeceleration: 2000,
            inertiaMaxSpeed: 1500,
            easeLinearity: 0.25
          }).setView([${initialLoc ? initialLoc.latitude : 0}, ${initialLoc ? initialLoc.longitude : 0}], ${initialLoc ? 16 : 2});

          var tiles = L.tileLayer('${getTileUrl(theme)}', {
            maxZoom: 19,
            updateWhenZooming: false,
            updateWhenIdle: true,
            keepBuffer: 4
          }).addTo(map);

          var path = L.polyline([], {
            color: '#007AFF',
            weight: 4,
            opacity: 0.85,
            smoothFactor: 1.5,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          // Pulsing live marker
          var pulseIcon = L.divIcon({
            className: '',
            html: '<div class="pulse-container"><div class="pulse-ring"></div><div class="pulse-ring-2"></div><div class="pulse-core" id="pfp-core">${avatarUrl ? `<img src="${avatarUrl}" />` : ''}</div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          var marker = L.marker([${initialLoc ? initialLoc.latitude : 0}, ${initialLoc ? initialLoc.longitude : 0}], { icon: pulseIcon, interactive: false }).addTo(map);

          var hasHomed = ${initialLoc ? 'true' : 'false'};
          var lastPos = ${initialLoc ? JSON.stringify([initialLoc.latitude, initialLoc.longitude]) : 'null'};

          var handler = function(event) {
            try {
              var msg = JSON.parse(event.data);
              var type = msg.type;
              var data = msg.data;

              if (type === 'UPDATE_LOCATION') {
                var pos = [data.latitude, data.longitude];
                marker.setLatLng(pos);
                lastPos = pos;
                document.body.style.opacity = 1;

                if (!hasHomed && data.latitude !== 0) {
                  map.flyTo(pos, 16, { animate: true, duration: 1.2, easeLinearity: 0.25 });
                  hasHomed = true;
                }

              } else if (type === 'UPDATE_HISTORY') {
                var points = data.map(function(l) { return [l.latitude, l.longitude]; });
                path.setLatLngs(points);
                document.body.style.opacity = 1;
                
                if (!hasHomed && points.length > 0) {
                  map.flyTo(points[points.length - 1], 16, { animate: true, duration: 1.2, easeLinearity: 0.25 });
                  hasHomed = true;
                }

              } else if (type === 'RECENTRE') {
                if (lastPos) map.flyTo(lastPos, 16, { animate: true, duration: 1.2, easeLinearity: 0.25 });

              } else if (type === 'FLY_TO') {
                map.flyTo([data.latitude, data.longitude], 16, { animate: true, duration: 1.5, easeLinearity: 0.2 });

              } else if (type === 'FIT_BOUNDS') {
                var bounds = path.getBounds();
                if (bounds.isValid()) {
                  map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1.5, easeLinearity: 0.2 });
                } else {
                  map.flyTo([0, 0], 2, { animate: true, duration: 1.5 });
                }

              } else if (type === 'ZOOM_STEP') {
                if (data > 0) map.zoomIn(data, { animate: true });
                else map.zoomOut(Math.abs(data), { animate: true });

              } else if (type === 'UPDATE_THEME') {
                tiles.setUrl(data.url);

              } else if (type === 'UPDATE_STYLE') {
                path.setStyle({ color: data.color });
                // Update pulse marker color via CSS variable
                document.documentElement.style.setProperty('--marker-color', data.color);
              } else if (type === 'UPDATE_PFP') {
                var core = document.getElementById('pfp-core');
                if (core) {
                  if (data) {
                    core.innerHTML = '<img src="' + data + '" />';
                  } else {
                    core.innerHTML = '';
                  }
                }
              }
            } catch (e) {}
          };

          document.addEventListener('message', handler);
          window.addEventListener('message', handler);
        </script>
      </body>
    </html>
  `, [avatarUrl]);

  // Push location updates
  useEffect(() => {
    if (currentLocation) {
      send('UPDATE_LOCATION', currentLocation);
    }
  }, [currentLocation, isReady]);

  // Push history (polyline) updates
  useEffect(() => {
    if (history.length > 0) {
      send('UPDATE_HISTORY', history);
    }
  }, [history, isReady]);

  // Push theme changes
  useEffect(() => {
    send('UPDATE_THEME', { url: getTileUrl(theme) });
  }, [theme, isReady]);

  // Push path color changes
  useEffect(() => {
    send('UPDATE_STYLE', { color: pathColor });
  }, [pathColor, isReady]);

  // Push PFP changes
  useEffect(() => {
    send('UPDATE_PFP', avatarUrl);
  }, [avatarUrl, isReady]);

  return (
    <View style={styles.container}>
      <WebView
        key="leaflet-map"
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={[styles.webview, { opacity: 0.99 }]}
        scrollEnabled={true}
        onLoadEnd={() => setIsReady(true)}
        androidLayerType="hardware"
        overScrollMode="never"
        cacheEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapComponent;
