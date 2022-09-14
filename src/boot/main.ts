import { boot } from 'quasar/wrappers';
import { mdiAlertOctagon, mdiCloseOctagon, mdiAccountCheck } from '@quasar/extras/mdi-v6';
import { Notify } from 'quasar';
import { plugin } from 'src/services/firebase';
import type { User } from 'firebase/auth';
import { useAuth } from 'stores/auth';
import {
  Loading,

  // optional!, for example below
  // with custom spinner
  QSpinnerGears
} from 'quasar'

export default boot(async ({ app, router }) => {
  app.use(plugin);

  const {
    auth: { service },
  } = app.config.globalProperties.$firebase;

  const auth = useAuth();


  auth.user = service.currentUser;

  service.onAuthStateChanged(async (user: User | null) => {
    try {
      const userCredential = await auth.getRedirectResult(service);

      if (userCredential) {

        Loading.show({
          message: 'Verificando membro da Tamandutech...',
          backgroundColor: 'black',
          spinner: QSpinnerGears,
        });

        const isMemberTTGihub = await auth.isMemberTTGihub(userCredential);

        Loading.hide();

        if (!isMemberTTGihub) {
          auth.logoutUser(service);
          Notify.create({
            message: 'Você precisa ser membro da Tamandutech no Github para acessar a plataforma.',
            icon: mdiCloseOctagon,
            color: 'negative',
          });
          return;
        }

        Notify.create({
          message: `Bem-vind@ ${user.displayName.split(' ').at(0)}!`,
          color: 'positive',
          icon: mdiAccountCheck,
        });
      }

      auth.handleOnAuthStateChanged(user);
      if (user) {
        await router.push({ name: 'index' });
      }
    } catch (error) {
      console.error('Erro ao tentar logar: ', error);
    }
  });

  router.beforeEach((to) => {
    if (!auth.user && to.meta.requiresAuth && to.name !== 'index') {

      Notify.create({
        message: 'Acesso as funcionalidades permitido somente a usuários autenticados',
        icon: mdiAlertOctagon,
      });

      return { name: 'index' };
    }
  });
});
