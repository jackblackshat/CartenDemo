export default {
  name: 'OnSpot',
  slug: 'onspot',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.onspot.parking',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'OnSpot needs your location to find nearby parking.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'OnSpot uses background location to detect when you park and leave.',
      NSLocationAlwaysUsageDescription:
        'OnSpot uses background location to detect parking events.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
    ],
    package: 'com.onspot.parking',
  },
  plugins: [
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'OnSpot uses background location to detect when you park and leave.',
        locationAlwaysPermission:
          'OnSpot uses background location to detect parking events.',
        locationWhenInUsePermission:
          'OnSpot needs your location to find nearby parking.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    ['expo-sensors'],
    ['@rnmapbox/maps'],
  ],
  extra: {
    apiBaseUrl: process.env.API_BASE_URL,
    mapboxToken: process.env.MAPBOX_TOKEN,
  },
};
