<template lang="pug">
  q-page(padding).fullscreen.bg-grey-4.window-height.window-width.row.justify-center.items-center
    amplify-authenticator(:authConfig="authConfig")
</template>

<script>
export default {
  name: 'Auth',
  props: [],
  data () {
    return {
      authConfig: {
        signInConfig: {
          isSignUpDisplayed: false
        },
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
