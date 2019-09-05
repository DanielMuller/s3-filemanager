<template lang="pug">
  q-page(padding v-if="user")
    .q-pa-md
      .q-gutter-y-md.column(style="max-width: 350px")

        q-input(readonly ref="username" outlined v-model="username" :dense="dense" label="Username" :rules="[val => !!val || 'Field is required']")
          template(v-slot:prepend)
            q-icon(name="account_circle")

        q-input(ref="email" outlined v-model="email" :dense="dense" label="E-Mail" :rules="[val => !!val || 'Field is required', emailFormat]")
          template(v-slot:prepend)
            q-icon(name="email")
          template(v-if="email !== user.attributes.email" v-slot:append)
            q-icon.cursor-pointer(name="cancel" @click.stop="email = user.attributes.email")
              template(v-slot:default)
                q-tooltip Update
          template(v-slot:after)
            div(v-if="email !== user.attributes.email")
              q-icon.cursor-pointer(name="send" @click="updateEmail")
            div(v-else)
              q-icon(v-if="email_verified" name="verified_user" color="positive")
                template(v-slot:default)
                  q-tooltip E-Mail is verified
              q-icon.cursor-pointer(v-if="!email_verified" name="verified_user" color="negative" @click="resendCode")
                template(v-slot:default)
                  q-tooltip E-Mail is not verified

        q-input(ref="password" outlined :type="isPwd ? 'password' : 'text'" v-model="password" :dense="dense" label="Password" :rules="[val => (val.length === 0 || val.length >= 8) || 'Password should be at least 8 characters']" lazy-rules)
          template(v-slot:prepend)
            q-icon(name="lock")
          template(v-slot:append)
            q-icon.cursor-pointer(:name="isPwd ? 'visibility_off' : 'visibility'" @click="isPwd = !isPwd")
            q-icon.cursor-pointer(v-if="password !== ''" name="cancel" @click="reset('password')")

        q-input(ref="passwordRepeat" outlined :type="isPwd2 ? 'password' : 'text'" v-model="passwordRepeat" :dense="dense" label="Password Verification" hint="Leave empty to keep current password" :rules="[val => val === this.password || 'Passwords don\\\'t match']" lazy-rules)
          template(v-slot:prepend)
            q-icon(name="lock")
          template(v-slot:append)
            q-icon.cursor-pointer(:name="isPwd2 ? 'visibility_off' : 'visibility'" @click="isPwd2 = !isPwd2")
            q-icon.cursor-pointer(v-if="passwordRepeat !== ''" name="cancel" @click="reset('passwordRepeat')")
        q-btn(v-if="password && passwordRepeat" label="Update password" color="primary" @click="checkUpdatePassword")

    q-dialog(v-model="verifyEmail" persistent)
      q-card(style="min-width: 400px")
        q-card-section
          .text-h6 Verification code received via E-Mail
        q-card-section
          .text-negative(v-if="verificationError") {{verificationError}}
        q-card-section
          q-input(:dense="dense" v-model="verificationCode" outlined autofocus @keyup.enter="prompt = false" mask="######")
        q-card-actions(align="right" class="text-primary")
          q-btn(flat label="Cancel" v-close-popup)
          q-btn(flat label="Validate" @click="validateCode")

    q-dialog(v-model="updatePassword" persistent)
      q-card(style="min-width: 400px")
        q-card-section
          .text-h6 Current password for verification
        q-card-section
          .text-negative(v-if="verificationError") {{verificationError}}
        q-card-section
          q-input(ref="currentPassword" outlined autofocus @keyup.enter="prompt = false" type="password" v-model="currentPassword" :dense="dense" label="Password")
        q-card-actions(align="right" class="text-primary")
          q-btn(flat label="Cancel" v-close-popup)
          q-btn(flat label="Update" @click="changePassword")
</template>

<script>
export default {
  name: 'Profile',
  data () {
    return {
      dense: this.$q.platform.is.mobile,
      verifyEmail: false,
      verificationCode: null,
      verificationError: '',
      isPwd: true,
      isPwd2: true,
      updatePassword: false,
      user: null,
      username: '',
      email: '',
      email_verified: false,
      password: '',
      passwordRepeat: '',
      currentPassword: ''
    }
  },
  beforeCreate () {
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        this.user = user
        this.username = user.username
        this.email = user.attributes.email
        this.email_verified = user.attributes.email_verified
      })
      .catch(err => { // eslint-disable-line handle-callback-err
      })
  },
  methods: {
    emailFormat (val) {
      return /^\S+@\S+\.\S\S+$/.test(val) || 'Invalid format'
    },
    reset (field) {
      this.$refs[field].resetValidation()
      this[field] = ''
      this.isPwd = true
      this.isPwd2 = true
    },
    updateEmail () {
      this.$refs.email.validate()
      if (this.$refs.email.hasError) {
        this.$q.notify({
          color: 'negative',
          position: 'center',
          message: 'E-Mail is invalid'
        })
        return
      }
      this.verifyEmail = true
      this.$Auth.updateUserAttributes(this.user, { 'email': this.email })
        .then(result => {
          this.$Auth.currentAuthenticatedUser({ bypassCache: true })
            .then(user => {
              this.user = user
              this.username = user.username
              this.email = user.attributes.email
              this.email_verified = user.attributes.email_verified
            })
        })
    },
    resendCode () {
      this.verifyEmail = true
      this.$Auth.verifyCurrentUserAttribute('email')
    },
    validateCode () {
      this.$Auth.verifyCurrentUserAttributeSubmit('email', this.verificationCode).then(res => {
        this.verificationCode = ''
        this.verificationError = ''
        this.$Auth.currentAuthenticatedUser({ bypassCache: true })
          .then(user => {
            this.user = user
            this.username = user.username
            this.email = user.attributes.email
            this.email_verified = user.attributes.email_verified
          })
        this.verifyEmail = false
        this.$q.notify({
          color: 'positive',
          position: 'center',
          message: 'E-Mail updated and validated'
        })
      })
        .catch(err => {
          this.verificationCode = ''
          this.verificationError = err.message
        })
    },
    checkUpdatePassword () {
      if (this.password && this.passwordRepeat) {
        this.$refs.password.validate()
        this.$refs.passwordRepeat.validate()
        if (!this.$refs.password.hasError && !this.$refs.passwordRepeat.hasError) {
          this.updatePassword = true
        }
      }
    },
    changePassword () {
      this.$Auth.changePassword(this.user, this.currentPassword, this.password)
        .then(data => {
          this.password = ''
          this.passwordRepeat = ''
          this.currentPassword = ''
          this.updatePassword = false
          this.$q.notify({
            color: 'positive',
            position: 'center',
            message: 'Password updated'
          })
        })
        .catch(err => {
          this.verificationError = err.message
          this.currentPassword = ''
        })
    }
  }
}
</script>

<style lang="stylus">
.json
  font-size 0.7em
</style>
