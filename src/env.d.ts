/* eslint-disable */

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    GITHUB_CLIENT_ID: string;
    API_KEY: string;
    AUTH_DOMAIN: string;
    DATA_BASE_URL: string;
    PROJECT_ID: string;
    STORAGE_BUCKET: string;
    MESSAGING_SENDER_ID: string;
    APP_ID: string;
    MEASUREMENT_ID: string;
    GH_CLIENT_SECRET: string;
    GH_CLIENT_ID: string;
    OAUTH_REDIRECT_URI: string;
  }
}
