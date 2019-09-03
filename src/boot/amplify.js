import Amplify, * as AmplifyModules from 'aws-amplify'
import {
  AmplifyPlugin,
  AmplifyEventBus
} from 'aws-amplify-vue'
import AwsExports from '../aws-exports'
Amplify.configure(AwsExports)

export default async ({
  router,
  Vue
}) => {
  Vue.use(AmplifyPlugin, AmplifyModules)
  Vue.prototype.$Amplify = Amplify
  Vue.prototype.$AmplifyEventBus = AmplifyEventBus
  Vue.prototype.$Auth = AmplifyModules.Auth
  let logLevel = 'INFO'
  if (process.env.DEV) {
    logLevel = 'DEBUG'
  }
  Vue.prototype.$Logger = new AmplifyModules.Logger('app', logLevel)

  router.beforeResolve((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      // eslint-disable-next-line no-unused-vars
      let user
      Vue.prototype.$Amplify.Auth.currentAuthenticatedUser().then(data => {
        if (data && data.signInUserSession) {
          user = data
        }
        next()
      }).catch((e) => {
        next({
          path: '/auth'
        })
      })
    } else {
      next()
    }
  })
}
