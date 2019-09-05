<template lang="pug">
  .row.fit.relative-position.items-top
    q-uploader.fit.relative-position(square multiple style="max-height: none" no-thumbnails color="grey-3" text-color="black")
</template>

<script>
export default {
  name: 'UploadManager',
  computed: {
    uploadPath () {
      return this.$store.state.fileBrowser.path
    }
  }
}
</script>
