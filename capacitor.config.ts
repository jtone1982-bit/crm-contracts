import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.tone.crmcontracts',
  appName: 'CRM Контракты',
  webDir: 'out',
  server: {
    url: 'https://tone-crm.ru',
    cleartext: false,
  },
};

export default config;
