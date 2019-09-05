<template lang="pug">
  q-layout(view="lHh Lpr lFf")
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
    )
      q-list
        q-item-label(header v-if="signedIn") Development
        q-item(v-if="signedIn && isDev" clickable :to="{name:'debug'}")
          q-item-section(avatar)
            q-icon(name="build")
          q-item-section
            q-item-label Debug
        q-item-label(header v-if="signedIn") Account
        q-item(v-if="signedIn" clickable :to="{name:'profile'}")
          q-item-section(avatar)
            q-icon(name="account_box")
          q-item-section
            q-item-label Profile
        q-item(v-if="signedIn" clickable @click="signOut")
          q-item-section(avatar)
            q-icon(name="lock")
          q-item-section
            q-item-label Sign Out
        q-item(v-if="signedIn" clickable :to="{name:'browse'}")
          q-item-section(avatar)
            q-icon(name="folder")
          q-item-section
            q-item-label My Files

    q-page-container
      router-view
</template>

<script>
import { openURL } from 'quasar'

export default {
  name: 'MyLayout',
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
    openURL,
    signOut: function (event) {
      this.$Amplify.Auth.signOut()
        .then(() => {
          this.$AmplifyEventBus.$emit('authState', 'signedOut')
        })
        .catch(e => {
          this.$Logger.error(e.message)
        })
    }
  }
}
</script>

<style>
</style>
