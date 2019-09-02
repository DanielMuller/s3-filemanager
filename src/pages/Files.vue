<template lang="pug">
  q-page(padding)
    amplify-photo-picker(v-if="showUploader" v-bind:photoPickerConfig="photoPickerConfig").q-mb-md
    q-table(
      :dense="$q.screen.lt.md"
      :data="items"
      :columns="columns"
      row-key="key"
      :pagination.sync="pagination"
      :loading="loading"
      :filter="filter"
      :grid="$q.screen.xs"
      :selected-rows-label="getSelectedString"
      selection="multiple"
      :selected.sync="selected"
    )
      template(v-slot:top)
        q-breadcrumbs
          q-breadcrumbs-el(label="Home" icon="home" @click="setPath()")
          q-breadcrumbs-el(v-for="item,key in breadcrumbs" :key="item" :label="item" icon="folder" @click="setPath(key)")
        q-space
        q-input(outlined dense debounce="300" color="primary" v-model="filter" placeholder="Filter")
          template(v-slot:append)
            q-icon(name="search")
        q-space
        q-btn(flat dense :disable="loading" icon="create_new_folder")
          q-popup-edit(v-model="newFolder")
            q-input(v-model="newFolder" dense autofocus @keyup.enter="mkdir")
        q-btn(flat dense :disable="loading" icon="note_add" @click="showUploader = !showUploader")
        q-btn(v-if="selected.length > 0" flat dense :disable="loading" icon="delete_forever" @click="delete_files")
</template>

<script>
const path = require('path')
import { date, format } from 'quasar'

export default {
  name: 'Files',
  data () {
    return {
      user: null,
      userInfo: null,
      items: [],
      newFolder: '',
      loading: true,
      filter: '',
      selected: [],
      columns: [
        {
          name: 'type',
          label: '',
          required: false,
          align: 'left',
          field: row => this.getIcon(row.key),
          sortable: true
        },
        {
          name: 'name',
          label: 'Name',
          required: true,
          align: 'left',
          field: row => path.basename(row.key),
          sortable: true
        },
        {
          name: 'size',
          label: 'Size',
          required: true,
          align: 'right',
          field: 'size',
          format: (val, row) => (this.getIcon(row.key) === 'folder') ? '' : format.humanStorageSize(val),
          sortable: true
        },
        {
          name: 'modified',
          label: 'Modified',
          required: true,
          align: 'right',
          field: 'lastModified',
          format: (val, row) => date.formatDate(val, 'YYYY-MM-DD HH:mm'),
          sortable: true
        }
      ],
      pagination: {
        sortBy: 'modified',
        descending: true,
        page: 1,
        rowsPerPage: 50
      },
      path: 'uploads',
      options: {
        level: 'private'
      },
      showUploader: false
    }
  },
  mounted () {
    this.getFiles()
  },
  beforeCreate () {
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        this.user = user
        this.$Auth.currentUserInfo().then(userInfo => {
          this.userInfo = userInfo
        })
      })
      .catch(err => { // eslint-disable-line handle-callback-err
      })
  },
  created () {
    this.$AmplifyEventBus.$on('fileUpload', item => {
      this.loading = true
      this.showUploader = false
      this.$Amplify.Storage.list(item, this.options)
        .then(res => {
          this.items = this.items.concat(res)
          this.loading = false
        })
    })
  },
  watch: {
    path: (newPath, oldPath) => {
      this.items = []
      this.getFiles()
    }
  },
  methods: {
    setPath (key = null) {
      if (!key) {
        this.path = 'uploads'
        return
      }
      let newPath = this.path.slice(0, key)
      console.log(newPath)
    },
    getFiles () {
      this.$Amplify.Storage.list(this.path, this.options)
        .then(res => {
          this.loading = false
          this.items = this.items.concat(res)
        })
        .catch(e => this.setError(e))
    },
    getSelectedString () {
      return this.selected.length === 0 ? '' : `${this.selected.length} record${this.selected.length > 1 ? 's' : ''} selected of ${this.items.length}`
    },
    delete_files () {
      console.log(this.selected)
    },
    mkdir () {
      let newPath = path.join(this.path, this.newFolder, '/')
      this.$Amplify.Storage.put(
        newPath,
        '',
        this.options
      )
        .then((result) => {
          this.path = newPath
          this.newFolder = ''
        })
        .catch(err => {
          console.error(err)
        })
    },
    getIcon (key) {
      let icon = 'file'
      if (key.slice(-1) === '/') {
        icon = 'folder'
      }
      return icon
    }
  },
  computed: {
    breadcrumbs () {
      return this.path.split('/').slice(1)
    },
    photoPickerConfig () {
      return {
        storageOptions: {
          level: 'private',
          metadata: {
            owner: this.user.username
          }
        },
        path: this.path
      }
    }
  }
}
</script>

<style>
</style>
