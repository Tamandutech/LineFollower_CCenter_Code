import { mdiApple, mdiGooglePlay, mdiTestTube } from '@quasar/extras/mdi-v6';
import type { QVueGlobals } from 'quasar';

export type Action = {
  href: string;
  icon: string;
  label: string;
  color: string;
};

export type Warning = {
  title: string;
  description: string;
  condition: (
    platform: QVueGlobals['platform'],
    isAuthenticated: boolean,
  ) => boolean;
  actions: Action[] | ((platform: QVueGlobals['platform']) => Action[]);
};

export const warnings: Warning[] = [
  {
    title: 'Problema com login?',
    description:
      'Se você possui o aplicativo GitHub instalado é necessário desabilitar a abertura de links suportados pelo aplicativo.',
    condition: (platform, isAuthenticated) =>
      platform.is.android && !isAuthenticated,
    actions: [],
  },
  {
    title: 'Ação necessária',
    description:
      'Você está utilizando um sistema operacional Linux ou Windows anterior a versão 10. É necessário habilitar os recursos experimentais do Chrome.',
    condition: (platform) =>
      platform.is.linux ||
      (platform.is.win && !platform.userAgent.includes('Windows NT 10')),
    actions: [
      {
        href: 'chrome://flags/#enable-experimental-web-platform-features',
        color: 'white',
        label: 'Acessar',
        icon: mdiTestTube,
      },
    ],
  },
  {
    title: 'Navegador não suportado',
    description:
      'Detectamos que você está utilizando um navegador não testado. Para uso de todas as funções, como BLE Web e PWA, no iPhone, recomendamos o navegador "Bluefy – Web BLE Browser".',
    condition: (platform) =>
      (platform.is.android ||
        platform.is.linux ||
        platform.is.mac ||
        platform.is.win) &&
      !platform.is.chrome &&
      !platform.is.edgeChromium,
    actions: (platform) => {
      if (platform.is.ios) {
        return [
          {
            href: 'https://apps.apple.com/br/app/bluefy-web-ble-browser/id1509870386',
            label: 'Instalar',
            icon: mdiTestTube,
            color: 'white',
          },
        ];
      }
      if (platform.is.android) {
        return [
          {
            href: 'market://details?id=com.android.chrome',
            label: 'Instalar',
            icon: mdiGooglePlay,
            color: 'white',
          },
        ];
      }
      if (platform.is.linux) {
        return [
          {
            href: 'https://www.google.com/chrome/',
            label: 'Instalar',
            color: 'white',
            icon: mdiGooglePlay,
          },
        ];
      }
      if (platform.is.mac) {
        return [
          {
            href: 'https://www.google.com/chrome/',
            label: 'Instalar',
            color: 'white',
            icon: mdiApple,
          },
        ];
      }
      return [];
    },
  },
];
