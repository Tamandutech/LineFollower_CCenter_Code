import { defineStore } from 'pinia';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

const defaultSettings: Dashboard.Settings = {
  batteryStatusUpdateInterval: 60000,
  batteryLowWarningThreshold: 6000,
  batteryLowWarningInterval: 60000,
};

export const useSessionStore = defineStore('session', {
  state: (): Partial<Dashboard.Session> => ({
    competitionId: null,
    userId: null,
    robot: null,
    settings: null,
  }),

  actions: {
    /**
     * @throws `Error` caso usuário atual não tenha sido autenticado
     */
    async fetchUserSession(): Promise<void> {
      if (!this.userId) {
        throw new Error('O usuário deve estar autenticado');
      }

      const userDocRef = doc(this.firestore, 'users', this.userId);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        const data = userDocSnapshot.data();
        return this.$patch({ settings: data.settings, competitionId: data.competition?.id });
      }

      const session: Omit<Dashboard.Session, "robot"> = {
        userId: this.userId,
        settings: defaultSettings,
        competitionId: null,
      }
      setDoc(userDocRef, session);
      return this.$patch(session);
    },
    async handleAuthStateChange(user: User | null) {
      if (user) {
        this.userId = user.uid;
        await this.fetchUserSession();
      }
    },
  },

  sync: {
    collection: 'users',
    doc: 'userId',
    fields: new Map([
      ['userId', { field: 'userId' }],
      ['settings', { field: 'settings' }],
      ['competitionId', { field: 'competition', ref: 'competitions' }],
    ]),
    create: false,
  },
});
