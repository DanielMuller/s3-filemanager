<template lang="pug">
  q-page(padding v-if="user")
    h1 Welcome {{ user.username }}
    q-list.rounded-borders(bordered)
      q-expansion-item(expand-separator icon="perm_identity" label="this.user" caption="this.$Auth.currentAuthenticatedUser()")
        q-card
          q-card-section.scroll.json
            pre {{user}}
      q-expansion-item(v-if="userInfo" expand-separator icon="face" label="this.userInfo" caption="this.$Auth.currentUserInfo()")
        q-card
          q-card-section.scroll.json
            pre {{userInfo}}
      q-expansion-item(expand-separator icon="settings_applications" label="$q")
        q-card
          q-card-section.scroll.json
            pre {{$q}}
</template>

<script>
export default {
  name: 'Profile',
  data () {
    return {
      user: null,
      userInfo: null
    }
  },
  beforeCreate () {
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        this.user = user
        this.$Auth.currentUserInfo().then(userInfo => {
          this.userInfo = userInfo
        })
      })
      .catch(err => { // eslint-disable-line handle-callback-err
      })
  }
}
</script>

<style lang="stylus">
.json
  font-size 0.7em
</style>
