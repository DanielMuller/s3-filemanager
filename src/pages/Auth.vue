<template lang="pug">
  q-page(padding).justify-center.items-center
    amplify-authenticator(:authConfig="authConfig")
</template>

<script>
export default {
  name: 'Auth',
  props: [],
  data () {
    return {
      authConfig: {
        signUpConfig: {
          hiddenDefaults: [
            'phone_number'
          ]
        }
      }
    }
  }
}
</script>

<style>
</style>
