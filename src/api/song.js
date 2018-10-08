import {commonParams} from './config'
import axios from 'axios'

/**
 * 将歌曲的mid转换为歌曲的播放地址
 */
export function midConvertUrl(mids) {
  let url = '/api/getMusicUrl'
  return axios.post(url, mids)
}

export function getLyric(mid) {
  const url = '/api/lyric'

  const data = Object.assign({}, commonParams, {
    songmid: mid,
    platform: 'yqq',
    hostUin: 0,
    needNewCode: 0,
    categoryId: 10000000,
    pcachetime: +new Date(),
    format: 'json'
  })

  return axios.get(url, {
    params: data
  }).then((res) => {
    return Promise.resolve(res.data)
  })
}
