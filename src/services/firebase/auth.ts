import { getAuth, GithubAuthProvider, onAuthStateChanged } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { PiniaPlugin, PiniaPluginContext } from 'pinia';

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
 * @returns `PiniaPlugin`
 */
export function piniaPlugin(
  service: Auth,
  github_provider: GithubAuthProvider
): PiniaPlugin {
  return ({ store, options }: PiniaPluginContext) => {
    if (options.actions.handleAuthStateChange === undefined) return;

    onAuthStateChanged(
      service,
      options.actions.handleAuthStateChange.bind(store)
    );

    return { service, github_provider };
  };
}
