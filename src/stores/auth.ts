import { defineStore } from 'pinia';
import { signInWithRedirect, getRedirectResult, signOut, GithubAuthProvider, UserCredential } from 'firebase/auth';
import type { User, Auth } from 'firebase/auth';

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null as User,
  }),
  getters: {
    getCurrentUser(state) {
      return state.user;
    },
  },
  actions: {
    loginUser(auth: LFCommandCenter.AuthService): void {
      signInWithRedirect(auth.service, auth.github_provider);
    },

    async isMemberTTGihub(userCredential: UserCredential): Promise<boolean> {
      try {
        const token = GithubAuthProvider.credentialFromResult(userCredential).accessToken;

        const response = await fetch('https://api.github.com/user/memberships/orgs/Tamandutech', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        });

        const membership = (await response.json()) as { state: string };

        if (membership.state === 'active')
          return Promise.resolve(true);

        return Promise.resolve(false);
      } catch (error) {
        console.error(error);
        return Promise.resolve(false);
      }
    },

    async getRedirectResult(auth: Auth): Promise<UserCredential> {
      try {
        return Promise.resolve(await getRedirectResult(auth));
      } catch (error) {
        return Promise.reject(error);
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
