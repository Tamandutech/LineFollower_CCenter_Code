import { initializeApp } from 'firebase/app';

const QENV = process.env.QENV;

export default () =>
  initializeApp({
    apiKey: process.env[`${QENV}_API_KEY`],
    authDomain: process.env[`${QENV}_AUTH_DOMAIN`],
    databaseURL: process.env[`${QENV}_DATA_BASE_URL`],
    projectId: process.env[`${QENV}_PROJECT_ID`],
    storageBucket: process.env[`${QENV}_STORAGE_BUCKET`],
    messagingSenderId: process.env[`${QENV}_MESSAGING_SENDER_ID`],
    appId: process.env[`${QENV}_APP_ID`],
  });
