import { boot } from 'quasar/wrappers';
import { plugin as firebase } from 'src/services/firebase';
import { plugin as ble, piniaPlugin as blePiniaPlugin } from 'src/services/ble';
import { piniaPlugin as authStorePlugin } from 'src/services/firebase/auth';
import { piniaPlugin as queuePlugin } from 'src/services/queue';

export default boot(async ({ app, router, store }) => {
  app.use(firebase);
  app.use(ble);

  const {
    auth: { service, github_provider },
  } = app.config.globalProperties.$firebase;
  store.use(authStorePlugin(service, github_provider, 'auth', router, 'index'));
  store.use(blePiniaPlugin(app.config.globalProperties.$ble));
  store.use(queuePlugin('commandQueue'));
  store.use(queuePlugin('queue'));

  router.beforeResolve((to) => {
    if (!service.currentUser && to.meta.requiresAuth) {
      return { name: 'index' };
    }
  });
});
