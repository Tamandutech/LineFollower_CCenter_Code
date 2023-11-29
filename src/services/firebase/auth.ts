import { Auth, getAuth, GithubAuthProvider } from 'firebase/auth';
import type { Router } from 'vue-router';
import type { FirebaseApp } from 'firebase/app';
import type { User } from 'firebase/auth';
import { PiniaPlugin, PiniaPluginContext } from 'pinia';

const provider = new GithubAuthProvider();
provider.addScope('repo');
provider.setCustomParameters({
  allow_signup: 'false',
  client_id: process.env.GH_CLIENT_ID,
  client_secret: process.env.GH_CLIENT_SECRET,
  redirect_uri: process.env.OAUTH_REDIRECT_URI,
});

export default (app: FirebaseApp): Firebase.AuthService => ({
  service: getAuth(app),
  github_provider: provider,
});

/**
 * Retorna um plugin para stores do Pinia que adiona o serviço
 * e o provedor de autenticação (Github) e registra a action "handleAuthStateChange"
 * como observer para estado do usuário atual.
 *
 * @param service Serviço de autenticação associado a um app do Firebase
 * @param github_provider Provedor de Open Auth
 * @param storeId ID da store que gerencia os usuários
 * @param router Vue Router
 * @param successRouteName Nome da rota para qual o usuário será redirecionado após se autenticar
 * @returns PiniaPlugin
 */
export function piniaPlugin(
  service: Auth,
  github_provider: GithubAuthProvider,
  storeId: string,
  router: Router,
  successRouteName = 'index'
): PiniaPlugin {
  return ({ store, options }: PiniaPluginContext) => {
    if (store.$id !== storeId) return;

    store.setUser(service.currentUser);

    service.onAuthStateChanged((user: User | null) =>
      options.actions.handleAuthStateChange.bind(store)(
        user,
        router,
        successRouteName
      )
    );

    return { service, github_provider };
  };
}
