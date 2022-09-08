import { plugin } from 'src/services/firebase';
import type { User } from 'firebase/auth';
import { useAuth } from 'stores/auth';
import { boot } from 'quasar/wrappers';

export default boot(async ({ app, router }) => {
  app.use(plugin);

  const {
    auth: { service },
  } = app.config.globalProperties.$firebase;
  const auth = useAuth();
  auth.user = service.currentUser;
  service.onAuthStateChanged(async (user: User | null) => {
    await auth.handleOnAuthStateChanged(user);
    if (user) await router.push({ path: '/' });
  });

  router.beforeEach((to) => {
    if (!auth.user && to.path !== '/login') {
      return { path: '/login' };
    }
  });
});
