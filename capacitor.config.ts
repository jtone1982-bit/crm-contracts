import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.tone.crmcontracts',
  appName: 'CRM Контракты',
  webDir: 'out',
  server: {
    url: 'https://tone-crm.ru',
    cleartext: false,
    allowNavigation: ['tone-crm.ru', '*.tone-crm.ru'],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
