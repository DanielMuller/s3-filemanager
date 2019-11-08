<template lang="pug">
  q-page.q-pa-md(padding)
    .text-h5 New User
    .q-gutter-md(style="max-width: 300px")
      q-input(v-model="username" label="Username")
      q-input(v-model="password" type="password" label="Temporary password")
      q-input(v-model="email" type="email" label="E-Mail")
      .bg-warning.q-pa-md(v-if="message")
        .text-weight-bold {{ message.code }}
        .text-body2 {{ message.message }}
      q-btn(:disable="validForm()" @click="addUser()") Add
</template>

<script>
export default {
  'name': 'newUser',
  data () {
    return {
      username: '',
      password: '',
      email: '',
      message: ''
    }
  },
  methods: {
    validForm () {
      return (this.username === '' || this.password === '' || this.email === '')
    },
    async addUser () {
      let apiName = 'AdminQueries'
      let path = '/createUser'
      let myInit = {
        body: {
          'username': this.username,
          'password': this.password,
          'email': this.email
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${(await this.$Auth.currentSession()).getAccessToken().getJwtToken()}`
        }
      }
      const response = await this.$Amplify.API.post(apiName, path, myInit)
      if (response.error) {
        this.message = response.error
      } else {
        this.$router.push({ 'name': 'adminListUsers' })
      }
    }
  }
}
</script>
