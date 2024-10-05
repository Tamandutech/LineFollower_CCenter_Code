<template>
  <q-btn v-if="auth.isAuthenticated">
    <q-avatar style="font-size: 42px">
      <img :src="auth.user?.photoURL || undefined" />
    </q-avatar>
    <q-menu fit transition-show="jump-down" transition-hide="jump-up">
      <div class="row no-wrap q-pa-md">
        <q-list>
          <q-item v-close-popup>
            <q-item-section>
              <q-item-label>Nome</q-item-label>
              <q-item-label caption>{{ auth.user?.displayName }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-close-popup>
            <q-item-section>
              <q-item-label>E-mail</q-item-label>
              <q-item-label caption>{{ auth.user?.email }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-close-popup>
            <q-item-section>
              <q-item-label>Autenticador</q-item-label>
              <q-item-label caption>{{
                auth.user?.providerData[0].providerId
              }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator inset spaced />

          <q-item clickable @click="logout">
            <q-item-section avatar>
              <q-avatar :icon="mdiExport"></q-avatar>
            </q-item-section>
            <q-item-section>Logout</q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-menu>
  </q-btn>

  <q-btn :icon="mdiAccountOff" v-else>
    <q-menu fit transition-show="jump-down" transition-hide="jump-up">
      <div class="row no-wrap q-pa-md">
        <div class="column items-center">
          <div class="text-subtitle1 q-mb-md">Login</div>

          <GitHubLoginButton></GitHubLoginButton>
        </div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { mdiExport, mdiAccountOff } from '@quasar/extras/mdi-v6';
import GitHubLoginButton from 'src/components/buttons/GitHubLoginButton.vue';
import { useAuth } from 'src/stores/auth';
import type { User } from '@firebase/auth';

const emit = defineEmits<{
  (e: 'login', user: User): void;
  (e: 'block'): void;
  (e: 'error', error: Error): void;
}>();

const auth = useAuth();
const logout = () => auth.logoutUser();
auth.$onAction(({ name, store, after, onError }) => {
  after(() => {
    if (name === 'setUser' && store.user) {
      emit('login', store.user);
    }
    if (name === 'blockUser') {
      emit('block');
    }
  });

  onError((error) => {
    emit('error', error as Error);
  });
});
</script>
