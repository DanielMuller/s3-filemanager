<template lang="pug">
  q-page(padding v-if="user")
    .q-pa-md
      .q-gutter-y-md.column(style="max-width: 300px")
        q-input(ref="username" outlined v-model="username" :dense="dense" label="Username" :rules="[val => !!val || 'Field is required']")
          template(v-slot:prepend)
            q-icon(name="account_circle")
        q-input(ref="email" outlined v-model="email" :dense="dense" label="E-Mail" :rules="[val => !!val || 'Field is required']")
          template(v-slot:prepend)
            q-icon(name="email")
        q-input(ref="password" outlined :type="isPwd ? 'password' : 'text'" v-model="password" :dense="dense" label="Password" :rules="[val => (val.length === 0 || val.length >= 8) || 'Password should be at least 8 characters']" lazy-rules)
          template(v-slot:prepend)
            q-icon(name="lock")
          template(v-slot:append)
            q-icon.cursor-pointer(:name="isPwd ? 'visibility_off' : 'visibility'" @click="isPwd = !isPwd")
            q-icon.cursor-pointer(v-if="password !== ''" name="close" @click="reset('password')")
        q-input(ref="passwordRepeat" outlined :type="isPwd2 ? 'password' : 'text'" v-model="passwordRepeat" :dense="dense" label="Password Verification" hint="Leave empty to keep current password" :rules="[val => val === this.password || 'Passwords don\\\'t match']" lazy-rules)
          template(v-slot:prepend)
            q-icon(name="lock")
          template(v-slot:append)
            q-icon.cursor-pointer(:name="isPwd2 ? 'visibility_off' : 'visibility'" @click="isPwd2 = !isPwd2")
            q-icon.cursor-pointer(v-if="passwordRepeat !== ''" name="close" @click="reset('passwordRepeat')")
        q-btn(label="Update" color="primary" @click="update")
</template>

<script>
export default {
  name: 'Profile',
  data () {
    return {
      dense: this.$q.platform.is.mobile,
      isPwd: true,
      isPwd2: true,
      user: null,
      username: '',
      email: '',
      password: '',
      passwordRepeat: ''
    }
  },
  beforeCreate () {
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        this.user = user
        this.username = user.username
        this.email = user.attributes.email
      })
      .catch(err => { // eslint-disable-line handle-callback-err
      })
  },
  methods: {
    reset (field) {
      this.$refs[field].resetValidation()
      this[field] = ''
    },
    update () {
      this.$refs.username.validate()
      this.$refs.email.validate()
      this.$refs.password.validate()
      this.$refs.passwordRepeat.validate()
      if (
        this.$refs.username.hasError ||
        this.$refs.email.hasError ||
        this.$refs.password.hasError ||
        this.$refs.passwordRepeat.hasError
      ) {
        this.$q.notify({
          color: 'negative',
          position: 'center',
          message: 'Some fields have errors'
        })
        return
      }
      let toUpdate = []
      if (this.password !== '') {
        toUpdate.push('password')
      }
      if (this.username !== this.user.username) {
        toUpdate.push('username')
      }
      if (this.email !== this.user.attributes.email) {
        toUpdate.push('email')
      }
      if (toUpdate.length > 0) {
        this.$q.notify({
          color: 'warning',
          position: 'center',
          message: 'We need to update ' + toUpdate.join(', ')
        })
      }
    },
    disable () {
      if (this.$refs && this.$refs.username) {
        this.$refs.username.validate()
        this.$refs.email.validate()
        this.$refs.password.validate()
        this.$refs.passwordRepeat.validate()
        return (
          this.$refs.username.hasError ||
          this.$refs.email.hasError ||
          this.$refs.password.hasError ||
          this.$refs.passwordRepeat.hasError
        )
      } else {
        return true
      }
    }
  }
}
</script>

<style lang="stylus">
.json
  font-size 0.7em
</style>
