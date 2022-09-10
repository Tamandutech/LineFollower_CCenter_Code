import { getAuth, GithubAuthProvider } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';

const QENV = process.env.QENV;

const provider = new GithubAuthProvider();
provider.addScope('repo');
provider.setCustomParameters({
  allow_signup: 'false',
  client_id: process.env[`${QENV}_GITHUB_CLIENT_ID`],
  redirect_uri: process.env[`${QENV}_BASE_URL`],
});

export default (app: FirebaseApp): LFCommandCenter.AuthService => ({
  service: getAuth(app),
  provider: provider,
});
