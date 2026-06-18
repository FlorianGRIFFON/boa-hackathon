// Copy to apps/<app-name>/app.config.ts when scaffolding a new app.
// Replace all APP_* placeholders.
import { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'APP_NAME',
  slug: 'APP_SLUG',
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
    bundleIdentifier: 'com.boa.APP_SLUG',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.boa.APP_SLUG',
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
