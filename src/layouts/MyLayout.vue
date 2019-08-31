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
        q-item(v-if="signedIn")
          q-item-section(avatar)
            q-icon(name="lock")
          q-item-section
            q-item-label
              amplify-sign-out
        q-item-label(header) Essential Links
        q-item(clickable tag="a" target="_blank" href="https://quasar.dev")
          q-item-section(avatar)
            q-icon(name="school")
          q-item-section
            q-item-label Docs
            q-item-label(caption) quasar.dev
        q-item(clickable tag="a" target="_blank" href="https://github.quasar.dev")
          q-item-section(avatar)
            q-icon(name="code")
          q-item-section
            q-item-label Github
            q-item-label(caption) github.com/quasarframework
        q-item(clickable tag="a" target="_blank" href="https://chat.quasar.dev")
          q-item-section(avatar)
            q-icon(name="chat")
          q-item-section
            q-item-label Discord Chat Channel
            q-item-label(caption) chat.quasar.dev
        q-item(clickable tag="a" target="_blank" href="https://forum.quasar.dev")
          q-item-section(avatar)
            q-icon(name="record_voice_over")
          q-item-section
            q-item-label Forum
            q-item-label(caption) forum.quasar.dev
        q-item(clickable tag="a" target="_blank" href="https://twitter.quasar.dev")
          q-item-section(avatar)
            q-icon(name="rss_feed")
          q-item-section
            q-item-label Twitter
            q-item-label(caption) @quasarframework
        q-item(clickable tag="a" target="_blank" href="https://facebook.quasar.dev")
          q-item-section(avatar)
            q-icon(name="public")
          q-item-section
            q-item-label Facebook
            q-item-label caption @QuasarFramework

    q-page-container
      router-view
</template>

<script>
import { openURL } from 'quasar'

export default {
  name: 'MyLayout',
  data () {
    return {
      leftDrawerOpen: false,
      signedIn: false
    }
  },
  created () {
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
    openURL
  }
}
</script>

<style>
</style>