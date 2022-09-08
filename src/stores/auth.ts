import { defineStore } from 'pinia';
import { signInWithPopup, signOut, GithubAuthProvider } from 'firebase/auth';
import type { User, Auth } from 'firebase/auth';

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
  }),
  getters: {
    getCurrentUser(state) {
      return state.user;
    },
  },
  actions: {
    async loginUser(auth: LFCommandCenter.AuthService): Promise<User | Error> {
      try {
        const result = await signInWithPopup(auth.service, auth.provider);
        const token = GithubAuthProvider.credentialFromResult(result).accessToken;

        const response = await fetch('https://api.github.com/user/memberships/orgs/Tamandutech', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        });
        const membership = (await response.json()) as { state: string };
        if (membership.state !== 'active') {
          this.logoutUser(auth.service);
          throw new Error('Acesso negado. Permitido apenas para membros da Tamandutech.');
        }

        this.user = result.user;
        return Promise.resolve<User>(this.user);
      } catch (error) {
        return Promise.reject<Error>(error);
      }
    },
    async logoutUser(service: Auth): Promise<void> {
      return signOut(service);
    },
    async handleOnAuthStateChanged(currentUser: User | null) {
      this.$patch((state) => {
        state.user = currentUser;
      });
    },
  },
});
