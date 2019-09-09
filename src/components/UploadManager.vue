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
      :s3UploadOptions="uploadOptions"
      @added="added"
      @uploaded="uploaded"
    )
</template>

<script>
import QUploaderS3 from './QUploaderS3'
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
        file.displayKey = `${this.uploadPath}${file.name}`
        file.dstPath = `${this.uploadPath}`
      })
    },
    uploaded (file) {
      if (file.dstPath === this.uploadPath) {
        this.$AmplifyEventBus.$emit('newItem', file)
      }
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
