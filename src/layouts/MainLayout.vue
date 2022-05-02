<template>
  <q-layout view="hHh Lpr lff">
    <q-header elevated class="bg-black">
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
        <q-toolbar-title>BraiaDash</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      show-if-above
      :width="300"
      :breakpoint="500"
      bordered
      class="bg-grey-3"
    >
      <q-scroll-area class="fit">
        <q-list>
          <q-item clickable :to="'/'" exact>
            <q-item-section avatar>
              <q-icon :name="'home'" />
            </q-item-section>
            <q-item-section> Início </q-item-section>
          </q-item>

          <q-separator :key="'sep' + index" />

          <q-expansion-item
            :content-inset-level="0.5"
            expand-separator
            icon="car_repair"
            label="Robô"
            default-opened
          >
            <q-item clickable :to="'/robot/parameters'" exact>
              <q-item-section avatar>
                <q-icon :name="'tune'" />
              </q-item-section>
              <q-item-section> Parâmetros </q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { ref } from 'vue';

const menuList = [
  {
    icon: 'home',
    label: 'Início',
    path: '/',
    separator: true,
  },
  {
    icon: 'smart_toy',
    label: 'Robot',
    path: '',
    separator: false,
  },
  {
    icon: 'delete',
    label: 'Trash',
    path: '',
    separator: false,
  },
  {
    icon: 'error',
    label: 'Spam',
    path: '',
    separator: true,
  },
  {
    icon: 'settings',
    label: 'Settings',
    path: '',
    separator: false,
  },
  {
    icon: 'feedback',
    label: 'Send Feedback',
    path: '',
    separator: false,
  },
  {
    icon: 'help',
    iconColor: 'primary',
    path: '',
    label: 'Help',
    separator: false,
  },
];

export default {
  setup() {
    return {
      drawer: ref(false),
      menuList,
    };
  },
};
</script>
