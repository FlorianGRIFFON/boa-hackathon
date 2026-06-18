import { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'DayRitual',
  slug: 'dayritual',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.boa.dayritual',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.boa.dayritual',
  },
  plugins: [
    'expo-router',
  ],
  extra: {
    eas: {
      projectId: 'EAS_PROJECT_ID',
    },
  },
}

export default config
