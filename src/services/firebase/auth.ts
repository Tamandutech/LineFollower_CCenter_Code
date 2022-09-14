import { getAuth, GithubAuthProvider } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';

const provider = new GithubAuthProvider();
provider.addScope('repo');
provider.setCustomParameters({
  allow_signup: 'false',
  client_id: process.env.GH_CLIENT_ID,
  client_secret: process.env.GH_CLIENT_SECRET,
  redirect_uri: process.env.OAUTH_REDIRECT_URI,
});

export default (app: FirebaseApp): LFCommandCenter.AuthService => ({
  service: getAuth(app),
  github_provider: provider,
});
