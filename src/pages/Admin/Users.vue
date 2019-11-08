<template lang="pug">
  q-page(padding)
    .text-h5 Users
    q-btn(rounded color="positive" icon="add_circle_outline" no-caps :to="{name:'adminNewUser'}") Create User
    .q-pa-md.row.items-start.q-gutter-md
      q-card(v-for="user in users" :key="user.Username" :class="userStatus(user)")
        q-card-section
          .text-h6 {{ user.Username }}
            q-icon(name="person" color="negative" v-if="user.isAdmin")
          .text-subtitle2 {{ user.email }}
            q-icon(name="verified_user" color="positive" v-if="user.email_verified")
            q-icon(name="error_outline" color="negative" v-if="!user.email_verified")
        q-card-section
          .text-body2 Created: {{ dateFormat(user.UserCreateDate) }}
          .text-body2 Modified: {{ dateFormat(user.UserLastModifiedDate) }}
          .text-body2 Status: {{ user.UserStatus }}
          .text-body2 Enabled: {{ user.Enabled }}
        q-card-actions(v-if="!mySelf(user)" align="right")
          q-btn(v-if="user.Enabled" flat round icon="remove_circle" text-color="grey" @click="setStatus(user, 'disabled')")
            q-tooltip Disable User
          q-btn(v-else flat round icon="add_circle" text-color="positive" @click="setStatus(user, 'enabled')")
            q-tooltip Enable User
          q-btn(v-if="!user.Enabled" flat round icon="delete" text-color="negative" @click="deleteUser(user)")
            q-tooltip Delete User
          q-btn(v-if="user.isAdmin" flat round icon="remove_circle_outline" text-color="accent" @click="revokeAdmin(user)")
            q-tooltip Revoke Admin
          q-btn(v-else flat round icon="add_circle_outline" text-color="accent" @click="promoteAdmin(user)")
            q-tooltip Promote Admin
</template>

<script>
import { date } from 'quasar'
export default {
  name: 'AdminUsers',
  data () {
    return {
      users: [],
      signedUser: null
    }
  },
  created () {
    this.listUsers()
  },
  beforeCreate () {
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        this.signedUser = user
        // this.username = user.username
        // this.email = user.attributes.email
        // this.email_verified = user.attributes.email_verified
      })
      .catch(err => { // eslint-disable-line handle-callback-err
      })
  },
  methods: {
    async setStatus (user, status) {
      let apiName = 'AdminQueries'
      let path = (status === 'enabled') ? '/enableUser' : '/disableUser'
      let myInit = {
        body: {
          'username': user.Username
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${(await this.$Auth.currentSession()).getAccessToken().getJwtToken()}`
        }
      }
      await this.$Amplify.API.post(apiName, path, myInit)
      for (let i = 0; i < this.users.length; i++) {
        if (this.users[i].Username === user.Username) {
          this.users[i].Enabled = (status === 'enabled')
        }
      }
    },
    async promoteAdmin (user) {
      await this.manageAdmin(user, true, '/addUserToGroup')
    },
    async revokeAdmin (user) {
      await this.manageAdmin(user, false, '/removeUserFromGroup')
    },
    async manageAdmin (user, isAdmin, path) {
      let apiName = 'AdminQueries'
      let myInit = {
        body: {
          'username': user.Username,
          'groupname': 'Admins'
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${(await this.$Auth.currentSession()).getAccessToken().getJwtToken()}`
        }
      }
      await this.$Amplify.API.post(apiName, path, myInit)
      for (let i = 0; i < this.users.length; i++) {
        if (this.users[i].Username === user.Username) {
          this.users[i].isAdmin = isAdmin
        }
      }
      return isAdmin
    },
    async listUsers (limit = 10, nextToken = '') {
      let apiName = 'AdminQueries'
      let path = '/listUsers'
      let myInit = {
        queryStringParameters: {
          'limit': limit,
          'token': nextToken
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${(await this.$Auth.currentSession()).getAccessToken().getJwtToken()}`
        }
      }
      const { NextToken, ...rest } = await this.$Amplify.API.get(apiName, path, myInit)
      nextToken = NextToken
      for (let i = 0; i < rest.Users.length; i++) {
        let groups = await this.listGroupsForUser(rest.Users[i].Username)
        let isAdmin = false
        if (groups.indexOf('Admins') > -1) {
          isAdmin = true
        }
        rest.Users[i].isAdmin = isAdmin
      }
      this.users = this.setUserAttributes(rest.Users)
      // this.users = rest.Users
      return rest
    },
    setUserAttributes (users) {
      for (let i = 0; i < users.length; i++) {
        users[i].Attributes.forEach(att => {
          users[i][att.Name] = att.Value
        })
      }
      return users
    },
    async deleteUser (user) {
      let apiName = 'AdminQueries'
      let path = '/deleteUser'
      let myInit = {
        body: {
          'username': user.Username
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${(await this.$Auth.currentSession()).getAccessToken().getJwtToken()}`
        }
      }
      await this.$Amplify.API.post(apiName, path, myInit)
      let indexToRemove = -1
      for (let i = 0; i < this.users.length; i++) {
        if (this.users[i].Username === user.Username) {
          indexToRemove = i
        }
      }
      this.users.splice(indexToRemove, 1)
    },
    mySelf (user) {
      return this.signedUser.attributes.sub === user.sub
    },
    userStatus (user) {
      return (user.Enabled) ? '' : 'bg-red-2'
    },
    async listGroupsForUser (username) {
      let apiName = 'AdminQueries'
      let path = '/listGroupsForUser'
      let myInit = {
        queryStringParameters: {
          'username': username
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${(await this.$Auth.currentSession()).getAccessToken().getJwtToken()}`
        }
      }
      const { NextToken, ...rest } = await this.$Amplify.API.get(apiName, path, myInit)
      return rest.Groups.map(item => item.GroupName)
    },
    dateFormat (dateString) {
      let now = new Date()
      let param = new Date(dateString)
      let diff = date.getDateDiff(now, param, 'minutes')
      if (diff > 1440) {
        return date.formatDate(dateString, 'DD/MM/YYYY')
      } else {
        return date.formatDate(dateString, 'HH:mm')
      }
    }
  }
}
</script>
