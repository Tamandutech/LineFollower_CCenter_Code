import { defineStore } from 'pinia';
import {
  signInWithRedirect,
  signOut,
  GithubAuthProvider,
  UserCredential,
  getRedirectResult,
} from 'firebase/auth';
import type { User, AuthError } from 'firebase/auth';
import type { Router } from 'vue-router';

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null as User,
    blocked: false,
  }),
  getters: {
    getCurrentUser: (state) => state.user,
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

        const membership = (await response.json()) as { state: string };
        if (membership.state === 'active') return Promise.resolve(true);
        return Promise.resolve(false);
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
      return signOut(this.service);
    },
    async handleAuthStateChange(
      user: User | null,
      router: Router,
      successRouteName: string
    ) {
      try {
        const userCredential = await getRedirectResult(this.service);
        if (userCredential && (await this.isMemberTTGithub(userCredential))) {
          this.setUser(user);
          router.push({ name: successRouteName });
          return Promise.resolve(this.getCurrentUser);
        }
        this.blockUser();
        return Promise.resolve(null);
      } catch (error) {
        return Promise.reject(error as AuthError);
      }
    },
    setUser(user: User | null) {
      this.$patch({ user });
    },
    blockUser() {
      this.$patch({ user: null, blocked: true });
    },
  },
});
