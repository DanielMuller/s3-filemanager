<template lang="pug">
  q-page(padding)
    .text-h5 Users
    .q-pa-md.row.items-start.q-gutter-md
      q-card(v-for="user in users" :key="user.Username")
        q-card-section
          .text-h6 {{ user.Username }}
            q-icon(name="person" color="negative" v-if="user.isAdmin")
          .text-subtitle2 {{ userEmail(user) }}
            q-icon(name="verified_user" color="positive" v-if="verifiedEmail(user)")
            q-icon(name="error_outline" color="negative" v-if="!verifiedEmail(user)")
        q-card-section
          .text-body2 Created: {{ dateFormat(user.UserCreateDate) }}
          .text-body2 Modified: {{ dateFormat(user.UserLastModifiedDate) }}
          .text-body2 Status: {{ user.UserStatus }}
          .text-body2 Enabled: {{ user.Enabled }}
</template>

<script>
import { date } from 'quasar'
export default {
  name: 'AdminUsers',
  data () {
    return {
      users: []
    }
  },
  created () {
    this.listUsers()
  },
  methods: {
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
      this.users = rest.Users
      return rest
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
    userEmail (user) {
      return user.Attributes.filter(att => att.Name === 'email')[0].Value
    },
    verifiedEmail (user) {
      return (user.Attributes.filter(att => att.Name === 'email_verified')[0].Value === 'true')
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
