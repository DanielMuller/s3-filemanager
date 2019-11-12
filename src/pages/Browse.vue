<template lang="pug">
  q-page(padding)
    q-table(
      :dense="$q.screen.lt.md"
      :data="items"
      :columns="columns"
      row-key="key"
      :pagination.sync="pagination"
      :loading="loading"
      :filter="filter"
      :selected-rows-label="getSelectedString"
      selection="multiple"
      :selected.sync="selected"
      :sort-method="customSort"
    )

      template(v-slot:top)
        q-breadcrumbs
          q-breadcrumbs-el.cursor-pointer(label="Home" icon="eva-home" to="/browse")
          q-breadcrumbs-el.cursor-pointer(v-for="item,key in breadcrumbs" :key="item" :label="item" icon="folder" :to="setPath(key)")
        q-space
        q-input(outlined dense debounce="300" color="primary" v-model="filter" placeholder="Filter")
          template(v-slot:append)
            q-icon(name="search")
        q-checkbox.q-ml-md(dense v-model="sortFolderFirst" label="Folders first")
        q-space
        q-btn(flat dense :disable="loading" icon="eva-folder-add")
          q-popup-edit(v-model="newFolder")
            q-input(v-model="newFolder" dense autofocus @keyup.enter="mkdir")
        q-btn(flat dense :disable="loading" icon="eva-file-add" @click="addFiles")
        q-btn(v-if="selected.length > 0" flat dense :disable="loading" icon="eva-trash" @click="deleteSelected")

      template(v-slot:body-cell-name="props")
        q-td(:props="props")
          div
            q-icon.q-mr-xs(:name="getIcon(props.row.type)" square size="1.5em")
            span.cursor-pointer(v-if="props.row.type === 'folder'")
              router-link(tag="span" :to="`/browse/${props.row.key}`") {{ basename(props.row.key) }}
            span(v-else) {{ basename(props.row.key) }}
            q-menu(
              touch-position
              context-menu
            )
              q-list(dense style="min-width: 100px")
                q-item(v-if="props.row.type !== 'folder'" dense clickable v-close-popup v-ripple @click="download(props.row.key)")
                  q-item-section(avatar)
                    q-icon(name="eva-external-link-outline")
                  q-item-section Open or Download
                q-item(dense clickable v-close-popup v-ripple @click="deleteOne(props.row.key)")
                  q-item-section(avatar)
                    q-icon(name="eva-close-circle-outline" color="negative")
                  q-item-section Delete
    q-dialog(v-model="confirmDelete" persistent)
      q-card
        q-card-section.row.items-center
          q-avatar(icon="eva-trash" color="negative" text-color="white")
          span.q-ml-sm(v-if="toDelete.length === 1") The file <span class="text-bold">{{this.toDelete[0]}}</span> will be permanentely deleted. Are your sure?
          span.q-ml-sm(v-else) The files
            ul
              li.text-bold(v-for="key in toDelete") {{key}}
            span will be permanentely deleted. Are your sure?
        q-card-actions(align="right")
          q-btn(flat label="Cancel" color="primary" v-close-popup)
          q-btn(flat label="Delete" color="primary" v-close-popup @click="deleteFiles")
</template>

<script>
const path = require('path')
import { date, format, openURL } from 'quasar'
import S3 from 'aws-sdk/clients/s3'

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
      sortFolderFirst: true,
      selected: [],
      confirmDelete: false,
      toDelete: [],
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
          format: (val, row) => row.isFolder ? '' : format.humanStorageSize(val),
          sortable: true
        },
        {
          name: 'modified',
          label: 'Modified',
          required: true,
          align: 'right',
          field: 'lastModified',
          format: (val, row) => row.isFolder ? '' : date.formatDate(val, 'YYYY-MM-DD HH:mm'),
          sortable: true
        }
      ],
      pagination: {
        sortBy: 'modified',
        descending: true,
        page: 1,
        rowsPerPage: 50
      },
      options: {
        level: 'private'
      },
      credentials: null
    }
  },
  watch: {
    path: function (val) {
      this.items = []
      if (this.userInfo) {
        this.listFiles()
      }
    }
  },
  mounted () {
    this.$Auth.currentAuthenticatedUser()
      .then(user => {
        user.isAdmin = false
        let payload = user['signInUserSession']['accessToken']['payload']
        if ('cognito:groups' in payload) {
          if (payload['cognito:groups'].indexOf('Admins') > -1) {
            user.isAdmin = true
          }
        }
        this.user = user
        this.$Auth.currentUserInfo().then(userInfo => {
          this.userInfo = userInfo
          this.$Auth.currentCredentials()
            .then(credentials => {
              this.credentials = this.$Auth.essentialCredentials(credentials)
              this.listFiles()
            })
        })
      })
      .catch(err => {
        this.$Logger.debug(err.message)
      })
    if (this.$route && this.$route.params && this.$route.params.pathMatch) {
      this.path = this.$route.params.pathMatch
    }
    this.$AmplifyEventBus.$on('newItem', file => {
      let item = {
        key: file.displayKey.replace(/^\//, ''),
        size: file.size,
        isFolder: false,
        eTag: null,
        lastModified: file.lastModified,
        lastModifiedTS: date.formatDate(file.LastModified, 'X'),
        type: this.getType(file.dstKey)
      }
      this.items.unshift(item)
    })
  },
  created () {
    this.$AmplifyEventBus.$on('fileUpload', item => {
      this.showUploader = false
      this.listFiles()
    })
  },
  beforeRouteUpdate (to, from, next) {
    if (to && to.params && to.params.pathMatch) {
      this.path = to.params.pathMatch
    } else {
      this.path = ''
    }
    next()
  },
  methods: {
    openURL,
    setPath (key = null) {
      if (key === null) {
        this.path = ''
        return
      }
      let newPath = `${this.path.split('/').slice(0, key + 1).join('/')}/`
      this.$Logger.debug(`New path: ${newPath}`)
      return `/browse/${newPath}`
    },
    listFiles () {
      this.loading = true
      let prefix = `private/${this.userInfo.id}/`

      if (this.user.isAdmin) {
        prefix = 'private/'
      }
      const s3 = new S3({ credentials: this.credentials })
      let params = {
        Bucket: this.$Amplify._config.aws_user_files_s3_bucket,
        Prefix: `${prefix}${this.path}`,
        Delimiter: '/'
      }
      s3.listObjectsV2(params).promise().then(res => {
        let folders = res.CommonPrefixes.map(item => {
          return {
            key: item.Prefix.substr(prefix.length),
            type: 'folder',
            isFolder: true,
            lastModified: 0,
            lastModifiedTS: 0,
            size: 0
          }
        })
        let files = res.Contents.map(item => {
          return {
            key: item.Key.substr(prefix.length),
            type: this.getType(item.Key),
            isFolder: false,
            eTag: item.ETag,
            lastModified: item.LastModified,
            lastModifiedTS: date.formatDate(item.LastModified, 'X'),
            size: item.Size
          }
        }).filter(item => item.key !== this.path)
        let items = [...folders, ...files]
        this.items = items
        this.loading = false
      })
        .catch(err => {
          this.$Logger.error(err.message)
        })
    },
    getSelectedString () {
      return this.selected.length === 0 ? '' : `${this.selected.length} record${this.selected.length > 1 ? 's' : ''} selected of ${this.items.length}`
    },
    deleteSelected () {
      this.toDelete = this.selected.map(item => item.key)
      this.confirmDelete = true
    },
    deleteOne (key) {
      this.toDelete = [key]
      this.confirmDelete = true
    },
    deleteFiles () {
      let deleteIt = []
      this.toDelete.forEach(key => {
        deleteIt.push(this.$Amplify.Storage.remove(key, this.options).then(res => key))
      })
      Promise.all(deleteIt).then(res => {
        // this.items = this.items.filter(item => res.indexOf(item.key) < 0)
        this.listFiles()
        this.toDelete = []
        this.selected = []
      })
    },
    download (key) {
      let options = Object.assign({}, this.options, { download: false, expires: 60 })
      this.$Amplify.Storage.get(key, options).then(url => {
        openURL(url)
      })
        .catch(err => {
          this.$Logger.error(err)
        })
    },
    mkdir () {
      this.showUploader = false
      let newPath = path.join(this.path, this.newFolder, '/')
      this.$Amplify.Storage.put(
        newPath,
        '',
        this.options
      )
        .then((result) => {
          this.$router.push(`/browse/${newPath}`)
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
      let data = [...rows]
      if (sortBy) {
        data.sort((a, b) => {
          let x = descending ? b : a
          let y = descending ? a : b
          if (sortBy === 'size') {
            return parseFloat(x.size) - parseFloat(y.size)
          } else if (sortBy === 'modified') {
            return parseFloat(x.lastModifiedTS) - parseFloat(y.lastModifiedTS)
          } else {
            return x.key > y.key ? 1 : x.key < y.key ? -1 : 0
          }
        })
      }
      if (this.sortFolderFirst) {
        data.sort((a, b) => {
          if (a.isFolder && !b.isFolder) {
            return -1
          }
          if (b.isFolder && !a.isFolder) {
            return 1
          }
        })
      }
      return data
    },
    addFiles () {
      this.showUploadManager = true
      this.$AmplifyEventBus.$emit('addFile', this.path)
    }
  },
  computed: {
    breadcrumbs () {
      return this.path.split('/').slice(0, -1)
    },
    showUploadManager: {
      get () {
        return this.$store.state.uploadManager.display
      },
      set (val) {
        this.$store.commit('uploadManager/display', val)
      }
    },
    path: {
      get () {
        return this.$store.state.fileBrowser.path
      },
      set (val) {
        this.$store.commit('fileBrowser/path', val)
      }
    }
  }
}
</script>

<style>
</style>
