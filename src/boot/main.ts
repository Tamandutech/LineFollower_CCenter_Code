import { markRaw } from 'vue';
import { boot } from 'quasar/wrappers';
import { plugin as firebase } from 'src/services/firebase';
import { plugin as ble, piniaPlugin as blePiniaPlugin } from 'src/services/ble';
import { piniaPlugin as authPiniaPlugin } from 'src/services/firebase/auth';
import { syncStoresPlugin } from 'src/services/firebase/firestore/plugins';

export default boot(async ({ app, router, store }) => {
  app.use(firebase);
  app.use(ble);

  const {
    auth: { service, github_provider },
  } = app.config.globalProperties.$firebase;
  store.use(authPiniaPlugin(service, github_provider));
  store.use(blePiniaPlugin(app.config.globalProperties.$ble));
  store.use(syncStoresPlugin(app.config.globalProperties.$firebase.db));
  store.use(({ store }) => {
    store.router = markRaw(router);
  });

  router.beforeResolve((to) => {
    if (!service.currentUser && to.meta.requiresAuth) {
      return { name: 'index' };
    }
  });
});
