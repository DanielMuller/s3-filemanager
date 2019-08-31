<template lang="pug">
  q-page(padding v-if="user")
    h1 Welcome {{ user.username }}
</template>

<script>
export default {
  name: 'Profile',
  data () {
    return {
      user: null
    }
  },
  beforeCreate () {
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        this.user = user
      })
      .catch(err => { // eslint-disable-line handle-callback-err
      })
  }
}
</script>

<style>
</style>
