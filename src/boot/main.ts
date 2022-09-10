import { boot } from 'quasar/wrappers';
import { mdiAlertOctagon } from '@quasar/extras/mdi-v6';
import { Notify } from 'quasar';
import { plugin } from 'src/services/firebase';
import type { User } from 'firebase/auth';
import { useAuth } from 'stores/auth';

export default boot(async ({ app, router }) => {
  app.use(plugin);

  const {
    auth: { service },
  } = app.config.globalProperties.$firebase;
  const auth = useAuth();
  auth.user = service.currentUser;
  service.onAuthStateChanged(async (user: User | null) => {
    await auth.handleOnAuthStateChanged(user);
    if (user) await router.push({ name: 'index' });
  });

  router.beforeEach((to) => {
    if (!auth.user && to.meta.requiresAuth && to.name !== 'login') {
      Notify.create({
        message: 'Acesso as funcionalidades permitido somente a usuários autenticados',
        icon: mdiAlertOctagon,
      });

      return { name: 'login' };
    }
  });
});
