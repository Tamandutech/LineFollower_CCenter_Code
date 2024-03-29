import { defineStore } from 'pinia';
import {
  signInWithRedirect,
  signOut,
  GithubAuthProvider,
  UserCredential,
  getRedirectResult,
} from 'firebase/auth';
import type { User, AuthError } from 'firebase/auth';

export const useAuth = defineStore('auth', {
  state: () => ({
    _user: null as User,
    _blocked: false,
  }),
  getters: {
    user: (state) => state._user,
    isAuthenticated: (state) => state._user !== null,
  },
  actions: {
    async isMemberTTGithub(userCredential: UserCredential): Promise<boolean> {
      try {
        const token =
          GithubAuthProvider.credentialFromResult(userCredential).accessToken;
        const response = await fetch(
          'https://api.github.com/user/memberships/orgs/Tamandutech',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
            },
          }
        );

        const membership = await response.json();
        return membership.state === 'active';
      } catch (error) {
        return Promise.reject(error);
      }
    },
    loginUser(): Promise<never> {
      try {
        return signInWithRedirect(this.service, this.github_provider);
      } catch (error) {
        Promise.reject(error as AuthError);
      }
    },
    logoutUser(): Promise<void> {
      this.setUser(null);
      return signOut(this.service);
    },
    async handleAuthStateChange(user: User | null) {
      try {
        const result = await getRedirectResult(this.service);

        // Usuário identificado via cookies salvos pelo navegador (já estava logado)
        if (!result) {
          if (user) this.setUser(user);

          return Promise.resolve();
        }

        // Usuário se autenticou após ser redirecionado na página do Github
        if (await this.isMemberTTGithub(result)) {
          this.setUser(user);
          this.router.push({ name: 'index' });
          return Promise.resolve(this._user);
        }
        this.blockUser();
        return Promise.resolve(null);
      } catch (error) {
        return Promise.reject(error as AuthError);
      }
    },
    setUser(user: User | null) {
      this._user = user;
    },
    blockUser() {
      this.$patch({ _user: null, _blocked: true });
      return signOut(this.service);
    },
  },
});
