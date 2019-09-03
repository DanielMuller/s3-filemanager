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
      :sort-method="customSort"
    )
      template(v-slot:top)
        q-breadcrumbs
          q-breadcrumbs-el.cursor-pointer(label="Home" icon="eva-home" @click="setPath()")
          q-breadcrumbs-el.cursor-pointer(v-for="item,key in breadcrumbs" :key="item" :label="item" icon="folder" @click="setPath(key)")
        q-space
        q-input(outlined dense debounce="300" color="primary" v-model="filter" placeholder="Filter")
          template(v-slot:append)
            q-icon(name="search")
        q-space
        q-btn(flat dense :disable="loading" icon="eva-folder-add")
          q-popup-edit(v-model="newFolder")
            q-input(v-model="newFolder" dense autofocus @keyup.enter="mkdir")
        q-btn(flat dense :disable="loading" icon="eva-file-add" @click="showUploader = !showUploader")
        q-btn(v-if="selected.length > 0" flat dense :disable="loading" icon="eva-trash" @click="delete_files")
      template(v-slot:body-cell-name="props")
        q-td(:props="props")
          div
            q-icon.q-mr-xs(:name="getIcon(getType(props.row.key))" square size="1.5em")
            span.cursor-pointer(v-if="getType(props.row.key) === 'folder'" @click="path = props.row.key") {{ basename(props.row.key) }}
            span(v-else) {{ basename(props.row.key) }}
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
          format: (val, row) => (this.getType(row.key) === 'folder') ? '' : format.humanStorageSize(val),
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
  watch: {
    path: function (val) {
      this.items = []
      this.getFiles()
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
  methods: {
    setPath (key = null) {
      if (!key) {
        this.path = 'uploads'
        return
      }
      let newPath = this.path.slice(0, key)
      this.$Logger.debug(newPath)
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
      this.$Logger.info(this.selected)
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
          this.$Logger.error(err)
        })
    },
    getType (key) {
      if (key.slice(-1) === '/') {
        return 'folder'
      }
      let images = [
        'jpg',
        'jpeg',
        'png',
        'gif'
      ]
      let videos = [
        'avi',
        'mov',
        'mp4',
        'mpeg',
        'mkv',
        'ogv'
      ]
      let audio = [
        'mp3',
        'ogg'
      ]
      let archive = [
        'gz',
        'tar',
        'zip',
        'deb'
      ]
      let text = [
        'csv',
        'json',
        'txt',
        'xml'
      ]
      let ext = path.extname(key).replace(/^\./, '').toLowerCase()
      if (images.includes(ext)) {
        return 'image'
      }
      if (videos.includes(ext)) {
        return 'film'
      }
      if (audio.includes(ext)) {
        return 'music'
      }
      if (archive.includes(ext)) {
        return 'archive'
      }
      if (text.includes(ext)) {
        return 'file-text'
      }
      return 'file'
    },
    getIcon (type) {
      return `eva-${type}`
    },
    basename (key) {
      return path.basename(key)
    },
    customSort (rows, sortBy, descending) {
      let data = [...rows].map(item => {
        item.isFolder = (this.getType(item.key) === 'folder')
        item.lastModifiedTS = date.formatDate(item.lastModified, 'X')
        return item
      })
      if (sortBy) {
        data.sort((a, b) => {
          let x = descending ? b : a
          let y = descending ? a : b
          // folders always first
          if (x.isFolder !== y.isFolder) {
            return -1
          }
          if (sortBy === 'size') {
            return parseFloat(x.size) - parseFloat(y.size)
          } else if (sortBy === 'modified') {
            return parseFloat(x.lastModifiedTS) - parseFloat(y.lastModifiedTS)
          } else {
            return x.key > y.key ? 1 : x.key < y.key ? -1 : 0
          }
        })
      }
      return data
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
