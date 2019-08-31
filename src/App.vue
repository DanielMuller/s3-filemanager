<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted () {
    this.$AmplifyEventBus.$on('authState', authState => {
      if (authState === 'signedIn') {
        this.$router.push({ name: 'home' })
      }
      if (authState === 'signedOut') {
        this.$router.push('/auth')
      }
    })
  }
}
</script>

<style>
</style>
