<template>
  <transition name="slide">
    <music-list :title="title" :bg-image="bgImage" :songs="songs"></music-list>
  </transition>
</template>

<script type="text/ecmascript-6">
import MusicList from 'components/music-list/music-list'
import {getSongList} from 'api/recommend'
import {midConvertUrl} from 'api/song'
import {ERR_OK} from 'api/config'
import {mapGetters} from 'vuex'
import {createSong} from 'common/js/song'

export default {
  computed: {
    title() {
      return this.disc.dissname
    },
    bgImage() {
      return this.disc.imgurl
    },
    ...mapGetters([
      'disc'
    ])
  },
  data() {
    return {
      songs: []
    }
  },
  created() {
    this._getSongList()
  },
  methods: {
    async _getSongList() {
      if (!this.disc.dissid) {
        this.$router.push('/recommend')
        return
      }
      let songRes = await getSongList(this.disc.dissid)
      if (songRes.code === ERR_OK) {
        this.songs = this._normalizeSongs(songRes.cdlist[0].songlist)
      }
      // 将歌曲id转换为歌曲的播放地址
      let midUrlRes = await midConvertUrl(this.songs.map((value) => {
        return value.mid
      }))
      // 将歌曲的播放地址赋值给歌曲的实体
      this.songs.forEach((value, index) => {
        let midUrl = midUrlRes.data[index]
        if (value.mid === midUrl.mid) {
          value.url = midUrl.purl
        }
      })
    },
    _normalizeSongs(list) {
      let ret = []
      list.forEach((musicData) => {
        if (musicData.songid && musicData.albummid) {
          ret.push(createSong(musicData))
        }
      })
      return ret
    }
  },
  components: {
    MusicList
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  .slide-enter-active, .slide-leave-active
    transition: all 0.3s

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
</style>
