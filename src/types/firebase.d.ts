declare namespace Firebase {
  type AuthService = {
    service: import('firebase/auth').Auth;
    github_provider: import('firebase/auth').GithubAuthProvider;
  };

  type Backend = {
    app: import('firebase/app').FirebaseApp;
    auth: AuthService;
  };
}
