import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
        name: 'index',
      },
    ],
  },
  {
    path: '/robot/parameters',
    meta: { requiresAuth: true },
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/RobotParametersPage.vue'),
        name: 'parameters',
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/robot/mapping',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/MappingPage.vue'),
        name: 'mapping',
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/robot/stream',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/StreamChartPage.vue'),
        name: 'stream',
        meta: { requiresAuth: true },
      },
    ],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
