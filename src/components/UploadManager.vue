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
      @added="added"
      @uploaded="uploaded"
    )
      template(v-slot:header="scope")
        .row.no-wrap.items-center.q-pa-sm.q-gutter-xs
          q-btn(v-if="scope.queuedFiles.length > 0" icon="clear_all" @click="scope.removeQueuedFiles" round dense flat)
            q-tooltip Clear All
          q-btn(v-if="scope.uploadedFiles.length > 0" icon="done_all" @click="scope.removeUploadedFiles" round dense flat)
            q-tooltip Remove Uploaded Files
          q-spinner(v-if="scope.isUploading" class="q-uploader__spinner")
          .col
            .q-uploader__subtitle {{ scope.uploadSizeLabel }} / {{ scope.uploadedSizeLabel }} ({{ scope.uploadProgressLabel }})
            q-linear-progress(
              size="md"
              :value="scope.uploadProgress"
              color="primary"
            )
            .q-uploader__subtitle {{ scope.uploadedFiles.length }} / {{ scope.files.length }}
            q-linear-progress(
              size="md"
              :value="uploadProgressFiles(scope)"
              color="primary"
            )
          q-btn.hidden(v-if="scope.canAddFiles" type="a" icon="add_box" round dense flat)
            q-uploader-add-trigger
            q-tooltip Pick Files
          q-btn(v-if="scope.canUpload" icon="cloud_upload" @click="scope.upload" round dense flat)
            q-tooltip Upload Files
          q-btn(v-if="scope.isUploading" icon="clear" @click="scope.abort" round dense flat)
            q-tooltip Abort Upload
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
              q-btn.gt-xs(
                v-if="file.__status==='uploading'"
                size="12px"
                flat
                dense
                round
                icon="pause"
                @click="scope.pauseFile(file)"
              )
              q-btn.gt-xs(
                v-else-if="file.__status==='paused' && scope.canUpload"
                size="12px"
                flat
                dense
                round
                icon="play_arrow"
                @click="scope.resumeFile(file)"
              )
              q-btn.gt-xs.no-pointer-events(
                v-else-if="file.__status==='paused' && !scope.canUpload"
                size="12px"
                flat
                dense
                round
                icon="hourglass_empty"
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
        file.dstKey = `${this.prefix}${this.uploadPath}${file.name}`
        file.displayKey = `/${this.uploadPath}${file.name}`
        file.dstPath = `${this.uploadPath}`
      })
    },
    uploaded ({ file, uploader }) {
      if (file.dstPath === this.uploadPath) {
        this.$AmplifyEventBus.$emit('newItem', file)
      }
    },
    uploadProgressFiles (scope) {
      return scope.files.length === 0
        ? 0
        : scope.uploadedFiles.length / scope.files.length
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
      if (this.$refs.uploadManager) {
        this.$refs.uploadManager.pickFiles()
      }
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
