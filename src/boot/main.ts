import { boot } from 'quasar/wrappers';
import { plugin as firebase } from 'src/services/firebase';
import { piniaPlugin as authStorePlugin } from 'src/services/firebase/auth';

export default boot(async ({ app, router, store }) => {
  app.use(firebase);

  const {
    auth: { service, github_provider },
  } = app.config.globalProperties.$firebase;
  store.use(authStorePlugin(service, github_provider, 'auth', router, 'index'));

  router.beforeResolve((to) => {
    if (!service.currentUser && to.meta.requiresAuth) {
      return { name: 'index' };
    }
  });
});
