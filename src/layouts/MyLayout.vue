<template lang="pug">
  q-layout(view="lHh LpR lFf")
    q-header(elevated)
      q-toolbar
        q-btn(
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
        )
          q-icon(name="menu")

        q-toolbar-title S3 File Manager

        div Quasar v{{ $q.version }}

    q-drawer(
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-2"
      side="left"
    )
      q-list(v-if="signedIn")
        q-item-label(v-if="isDev" header) Development
        q-item(v-if="signedIn && isDev" clickable :to="{name:'debug'}")
          q-item-section(avatar)
            q-icon(name="build")
          q-item-section
            q-item-label Debug
        q-item-label(header) Account
        q-item(v-if="signedIn" clickable :to="{name:'profile'}")
          q-item-section(avatar)
            q-icon(name="account_box")
          q-item-section
            q-item-label Profile
        q-item(clickable @click="signOut")
          q-item-section(avatar)
            q-icon(name="lock")
          q-item-section
            q-item-label Sign Out
        q-item(clickable :to="{name:'browse'}")
          q-item-section(avatar)
            q-icon(name="folder")
          q-item-section
            q-item-label My Files
        q-item(clickable @click="showUploadManager = !showUploadManager")
          q-item-section(avatar)
            q-icon(name="cloud_upload")
          q-item-section
            q-item-label Upload Manager

    q-drawer(
      v-model="showUploadManager"
      bordered
      elevated
      persistent
      side="right"
      :width="350"
    )
      upload-manager

    q-page-container
      router-view
</template>

<script>
import UploadManager from 'components/UploadManager'
export default {
  name: 'MyLayout',
  components: {
    UploadManager
  },
  data () {
    return {
      isDev: false,
      leftDrawerOpen: false,
      signedIn: false
    }
  },
  created () {
    this.isDev = process.env.DEV
    this.$AmplifyEventBus.$on('authState', authState => {
      if (authState === 'signedIn') {
        this.signedIn = true
      } else {
        this.signedIn = false
      }
    })
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        this.signedIn = true
      })
      .catch(err => { // eslint-disable-line handle-callback-err
        this.signedIn = false
      })
  },
  methods: {
    signOut: function (event) {
      this.$Amplify.Auth.signOut()
        .then(() => {
          this.$AmplifyEventBus.$emit('authState', 'signedOut')
        })
        .catch(e => {
          this.$Logger.error(e.message)
        })
    }
  },
  computed: {
    showUploadManager: {
      get () {
        return this.$store.state.uploadManager.display
      },
      set (val) {
        this.$store.commit('uploadManager/display', val)
      }
    }
  }
}
</script>

<style>
</style>
