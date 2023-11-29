import { inject } from 'vue';
import type { App } from 'vue';
import initFirebaseApp from './app';
import getAuthService from './auth';
import getFirestoreService from './firestore';

export const plugin = {
  install(app: App) {
    const firebaseApp = initFirebaseApp();
    const firebase = {
      app: firebaseApp,
      auth: getAuthService(firebaseApp),
      db: getFirestoreService(firebaseApp, app),
    };

    // Adiciona aplicação do firebase no escopo global da dashboard
    app.config.globalProperties.$firebase = firebase;
    app.provide(key, firebase);
  },
};

// Definir hook para injetar aplicação do firebase em qualquer componente
const key = Symbol('firebase');
export default () => inject<Firebase.Backend>(key);
