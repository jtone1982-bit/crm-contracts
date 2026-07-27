import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.tone.crmcontracts',
  appName: 'CRM Контракты',
  webDir: 'out',
  server: {
    url: 'https://ru.tone-crm.ru:8443',
    cleartext: false,
    allowNavigation: ['tone-crm.ru', '*.tone-crm.ru', 'ru.tone-crm.ru:8443'],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
