import { Notify } from 'quasar'
import { register } from 'register-service-worker'
import { mdiCloudDownload } from '@quasar/extras/mdi-v6';

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready(/* registration */) {
    // console.log('Service worker is active.')
  },

  registered(/* registration */) {
    // console.log('Service worker has been registered.')
  },

  cached(/* registration */) {
    // console.log('Content has been cached for offline use.')
  },

  updatefound(/* registration */) {
    // console.log('New content is downloading.')
    Notify.create({
      message: 'Instalando versão...',
      color: 'info',
      icon: mdiCloudDownload,
      timeout: 5,
      spinner: true
    })
  },

  updated(/* registration */) {
    // console.log('New content is available; please refresh.')
    Notify.create({
      message: 'Novo conteúdo disponível!',
      color: 'info',
      icon: mdiCloudDownload,
      actions: [
        { label: 'Atualizar', color: 'white', handler: () => { location.reload(true) } }
      ],
      timeout: 0
    })
  },

  offline() {
    // console.log('No internet connection found. App is running in offline mode.')
    Notify.create({
      type: 'warning',
      message: 'Sem conexão com a internet. Dash em modo offline.'
    })
  },

  error(/* err */) {
    // console.error('Error during service worker registration:', err)
  }
})
