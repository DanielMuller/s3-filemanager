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
        q-item-label(v-if="isAdmin" header) Admin
        q-item(v-if="isAdmin" clickable :to="{name:'adminListUsers'}")
          q-item-section(avatar)
            q-icon(name="account_box")
          q-item-section
            q-item-label List Users

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
      signedIn: false,
      isAdmin: false
    }
  },
  created () {
    this.isDev = process.env.DEV
    this.$AmplifyEventBus.$on('authState', authState => {
      if (authState === 'signedIn') {
        this.signedIn = true
        this.setAdminStatus()
      } else {
        this.signedIn = false
        this.isAdmin = false
      }
    })
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        this.signedIn = true
        this.setAdminStatus()
      })
      .catch(err => { // eslint-disable-line handle-callback-err
        this.signedIn = false
        this.isAdmin = false
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
    },
    setAdminStatus: function () {
      this.$Auth.currentSession().then(session => {
        let payload = session.getAccessToken().decodePayload()
        if ('cognito:groups' in payload) {
          if (payload['cognito:groups'].indexOf('Admins') > -1) {
            this.isAdmin = true
          } else {
            this.isAdmin = false
          }
        } else {
          this.isAdmin = false
        }
      })
        .catch(e => {
          this.isAdmin = false
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
