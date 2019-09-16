import { QUploaderBase } from 'quasar'
import S3 from 'aws-sdk/clients/s3'

function getFn (prop) {
  return typeof prop === 'function'
    ? prop
    : () => prop
}

export default {
  name: 'QUploaderS3',
  mixins: [ QUploaderBase ],
  props: {
    contentType: [Function, String],
    cacheControl: [Function, String],
    metadata: [Function, Array],
    credentials: [Function, Object],
    bucket: [Function, String],
    options: [Function, Object],
    factory: Function
  },

  data () {
    return {
      uploaders: [],
      promises: [],
      workingThreads: 0
    }
  },

  computed: {
    uploaderProps () {
      return {
        contentType: getFn(this.contentType),
        cacheControl: getFn(this.cacheControl),
        metadata: getFn(this.metadata),
        credentials: getFn(this.credentials),
        bucket: getFn(this.bucket),
        options: getFn(this.options)
      }
    },

    isUploading () {
      return this.workingThreads > 0
    },

    isBusy () {
      return this.promises.length > 0
    }
  },

  methods: {
    abort () {
      this.uploaders.forEach(x => { x.abort() })

      if (this.promises.length > 0) {
        this.abortPromises = true
      }
    },
    pauseFile (file) {
      if (this.disable) { return }

      if (file.__status === 'uploading') {
        file.__abort()
        this.$emit('paused', [ file ])
        this.__updateFile(file, 'paused', file.__uploaded)
      }
    },
    resumeFile (file) {
      if (this.disable) { return }

      if (file.__status === 'paused') {
        // file.uploader.send()
        this.upload()
        this.$emit('resume', [ file ])
      }
    },
    removeUploadedFiles () {
      if (!this.disable) {
        const removedFiles = []

        this.files.forEach(file => {
          if (file.__status === 'uploaded') {
            this.uploadSize -= file.size
            removedFiles.push(file)
          }
        })
        if (removedFiles.length > 0) {
          this.files = this.files.filter(f => f.__status !== 'uploaded')
          this.$emit('removed', removedFiles)
          this.uploadedSize = 0
          this.uploadedFiles = []
        }
      }
    },
    upload () {
      if (this.canUpload === false) {
        return
      }

      const queue = this.queuedFiles.slice(0)
      this.queuedFiles = []

      queue.forEach(file => {
        this.__runFactory(file)
      })
    },

    __runFactory (file) {
      this.workingThreads++

      if (typeof this.factory !== 'function') {
        this.__uploadFile(file, {})
        return
      }

      const res = this.factory(file)

      if (!res) {
        this.$emit(
          'factory-failed',
          new Error('QUploader: factory() does not return properly'),
          file
        )
        this.workingThreads--
      } else if (typeof res.catch === 'function' && typeof res.then === 'function') {
        this.promises.push(res)

        const failed = err => {
          if (this._isBeingDestroyed !== true && this._isDestroyed !== true) {
            this.promises = this.promises.filter(p => p !== res)

            if (this.promises.length === 0) {
              this.abortPromises = false
            }

            this.queuedFiles = this.queuedFiles.concat(file)
            this.__updateFile(file, 'failed')

            this.$emit('factory-failed', err, file)
            this.workingThreads--
          }
        }

        res.then(factory => {
          if (this.abortPromises === true) {
            failed(new Error('Aborted'))
          } else if (this._isBeingDestroyed !== true && this._isDestroyed !== true) {
            this.promises = this.promises.filter(p => p !== res)
            this.__uploadFile(file, factory)
          }
        }).catch(failed)
      } else {
        this.__uploadFile(file, res || {})
      }
    },
    __uploadFile (file, factory) {
      const getProp = (name, arg) => {
        return factory[name] !== void 0
          ? getFn(factory[name])(arg)
          : this.uploaderProps[name](arg)
      }
      const credentials = getProp('credentials', file)
      const s3 = new S3({ credentials: credentials, useAccelerateEndpoint: false })

      const bucket = getProp('bucket', file)
      const contentType = getProp('contentType', file)
      const options = getProp('options', file)
      const uploader = s3.upload({
        Bucket: bucket,
        Key: file.dstKey,
        Body: file,
        ContentType: contentType
      },
      options)

      let
        uploadIndexSize = 0,
        uploadedSize = 0,
        maxUploadSize = 0,
        aborted

      uploader.on('httpUploadProgress', e => {
        if (aborted === true) { return }

        const loaded = Math.min(maxUploadSize, e.loaded)

        this.uploadedSize += loaded - uploadedSize
        uploadedSize = loaded

        let size = uploadedSize - uploadIndexSize
        let uploaded = size > file.size
        if (uploaded) {
          size -= file.size
          uploadIndexSize += file.size
          this.__updateFile(file, 'uploading', file.size)
        } else {
          this.__updateFile(file, 'uploading', size)
        }
      })

      this.__updateFile(file, 'uploading', 0)
      file.uploader = uploader
      file.__abort = uploader.abort.bind(uploader)
      maxUploadSize += file.size

      this.$emit('uploading', { file, uploader })
      this.uploaders.push(uploader)

      uploader.send((err, data) => {
        if (err) {
          this.$Logger.error(err.message)
          aborted = true
          this.uploadedSize -= uploadedSize
          this.queuedFiles = this.queuedFiles.concat(file)
          this.__updateFile(file, 'failed')
          this.$emit('failed', { file, uploader })
        } else {
          this.uploadedFiles = this.uploadedFiles.concat(file)
          this.__updateFile(file, 'uploaded')
          this.$emit('uploaded', { file, uploader })
        }
        this.workingThreads--
        this.uploaders = this.uploaders.filter(x => x !== uploader)
      })
    }
  }
}
