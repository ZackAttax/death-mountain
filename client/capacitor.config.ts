import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deathmountain.loot-survivor-2',
  appName: 'Loot Survivor 2',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
