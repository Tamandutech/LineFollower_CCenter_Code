import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import type { App } from 'vue';

export * as utls from './utils';
export * as plugins from './plugins';

export default (app: FirebaseApp, vueApp: App) => {
  const db = getFirestore(app);
  enableIndexedDbPersistence(db).catch((err) => {
    vueApp.config.globalProperties.$warnings = [] as string[];
    vueApp.config.globalProperties.$warnings.push(err.code);
  });
  return db;
};
