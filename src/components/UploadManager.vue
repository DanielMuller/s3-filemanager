<template lang="pug">
  .row.fit.relative-position.items-top
    q-uploader-s3.fit.relative-position(
      ref="uploadManager"
      square
      multiple
      style="max-height: none"
      no-thumbnails
      color="grey-3"
      text-color="black"
      :credentials="credentials"
      :bucket="bucket"
      :contentType="contentType"
      :path="dstKey"
      @added="added"
      @uploaded="uploaded"
    )
      template(v-slot:list="scope")
        q-list(separator)
          q-item.q-uploader__file(v-for="file in scope.files" :key="file.name")
            q-item-section
              q-item-label.full-width.ellipsis {{ file.name }}
              q-item-label.ellipsis(caption) {{ file.displayKey }}
              q-item-label(caption) {{sizeLabel(file.__uploaded)}}/{{ file.__sizeLabel }} ({{ file.__progressLabel }})
              q-item-label
                q-linear-progress(
                  size="md"
                  :value="file.__progress"
                  color="primary"
                )
            q-item-section(top side)
              q-btn.gt-xs(
                size="12px"
                flat
                dense
                round
                icon="clear"
                @click="scope.removeFile(file)"
              )
</template>

<script>
import QUploaderS3 from './QUploaderS3'
import { format } from 'quasar'
const { humanStorageSize } = format

export default {
  name: 'UploadManager',
  data () {
    return {
      credentials: null,
      bucket: null,
      prefix: null
    }
  },
  components: {
    QUploaderS3
  },
  methods: {
    added (files) {
      files.forEach(file => {
        file.key = `${this.prefix}${this.uploadPath}${file.name}`
        file.displayKey = `/${this.uploadPath}${file.name}`
        file.dstPath = `${this.uploadPath}`
      })
    },
    uploaded ({ file, uploader }) {
      if (file.dstPath === this.uploadPath) {
        this.$AmplifyEventBus.$emit('newItem', file)
      }
    },
    sizeLabel (size) {
      return humanStorageSize(size)
    },
    dstKey (file) {
      return `${this.prefix}${this.uploadPath}${file.name}`
    },
    contentType (file) {
      return file.type
    }
  },
  computed: {
    uploadPath () {
      return this.$store.state.fileBrowser.path
    },
    uploadOptions () {
      return null
      // return {
      //   partSize: 100 * 1024 * 1024,
      //   queueSize: 100
      // }
    }
  },
  created () {
    this.$AmplifyEventBus.$on('addFile', addFile => {
      this.$refs.uploadManager.pickFiles()
    })
  },
  mounted () {
    this.$Auth.currentCredentials()
      .then(credentials => {
        this.credentials = this.$Auth.essentialCredentials(credentials)
      })
    this.$Auth.currentUserInfo().then(userInfo => {
      this.prefix = `private/${userInfo.id}/`
      this.bucket = this.$Amplify._config.aws_user_files_s3_bucket
    })
  }
}
</script>
