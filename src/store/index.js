import Vue from 'vue'
import Vuex from 'vuex'

// we first import the module
import uploadManager from './uploadManager'
import fileBrowser from './fileBrowser'

Vue.use(Vuex)

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    modules: {
      // then we reference it
      uploadManager,
      fileBrowser
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: process.env.DEV
  })

  /*
    if we want some HMR magic for it, we handle
    the hot update like below. Notice we guard this
    code with "process.env.DEV" -- so this doesn't
    get into our production build (and it shouldn't).
  */

  if (process.env.DEV && module.hot) {
    module.hot.accept(['./uploadManager', './fileBrowser'], () => {
      const newUploadManager = require('./uploadManager').default
      const newFileBrowser = require('./fileBrowser').default
      Store.hotUpdate({ modules: { uploadManager: newUploadManager, fileBrowser: newFileBrowser } })
    })
  }

  return Store
}
