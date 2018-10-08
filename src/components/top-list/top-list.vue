<template>
  <transition name="slide">
    <music-list :rank="rank" :title="title" :bg-image="bgImage" :songs="songs"></music-list>
  </transition>
</template>

<script type="text/ecmascript-6">
  import MusicList from 'components/music-list/music-list'
  import {getMusicList} from 'api/rank'
  import {midConvertUrl} from 'api/song'
  import {ERR_OK} from 'api/config'
  import {mapGetters} from 'vuex'
  import {createSong} from 'common/js/song'

  export default {
    computed: {
      title() {
        return this.topList.topTitle
      },
      bgImage() {
        if (this.songs.length) {
          return this.songs[0].image
        }
        return ''
      },
      ...mapGetters([
        'topList'
      ])
    },
    data() {
      return {
        songs: [],
        rank: true
      }
    },
    created() {
      this._getMusicList()
    },
    methods: {
      async _getMusicList() {
        if (!this.topList.id) {
          this.$router.push('/rank')
          return
        }
        let singerRes = await getMusicList(this.topList.id)
        if (singerRes.code === ERR_OK) {
          this.songs = this._normalizeSongs(singerRes.songlist)
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
        list.forEach((item) => {
          const musicData = item.data
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
    transition: all 0.3s ease

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
</style>
