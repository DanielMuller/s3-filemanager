<template lang="pug">
  q-page(padding)
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
  created () {
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        this.user = user
      })
  }
}
</script>

<style>
</style>
