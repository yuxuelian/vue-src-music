require('./check-versions')()

var config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

var opn = require('opn')
var path = require('path')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('./webpack.dev.conf')

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable

// 代理接口
var axios = require('axios')
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var apiRoutes = express.Router()

// 首页的推荐列表
apiRoutes.get('/getDiscList', function (req, res) {
  var url = 'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg'
  axios
    .get(url, {
      headers: {
        referer: 'https://c.y.qq.com/',
        host: 'c.y.qq.com'
      },
      params: req.query
    })
    .then((response) => {
      res.json(response.data)
    })
    .catch((e) => {
      console.log(e)
    })
})

// 首页推荐点击后的歌曲列表
apiRoutes.get('/getSongList', function (req, res) {
  const url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg'
  axios
    .get(url, {
      headers: {
        referer: 'https://y.qq.com/',
        host: 'c.y.qq.com'
      },
      params: req.query
    })
    .then((response) => {
      let ret = response.data
      if (typeof ret === 'string') {
        const reg = /{.*}/
        const matches = ret.match(reg)
        if (matches) {
          ret = JSON.parse(matches[0])
        }
      }
      res.json(ret)
    })
    .catch((e) => {
      console.log(e)
    })
})

// 根据歌曲的id获取歌曲的播放地址
apiRoutes.post('/getMusicUrl', function (req, res) {
  var url = 'https://u.y.qq.com/cgi-bin/musicu.fcg'
  let body = {
    req_0: {
      module: 'vkey.GetVkeyServer',
      method: 'CgiGetVkey',
      param: {
        guid: '4715368380',
        songmid: req.body,
        uin: ''
      }
    }
  }
  axios
    .post(url, body)
    .then((response) => {
      res.json(response.data.req_0.data.midurlinfo.map((value) => {
        return {
          purl: `http://182.140.219.30/amobile.music.tc.qq.com/${value.purl}`,
          mid: value.songmid
        }
      }))
    })
    .catch((e) => {
      console.log(e)
    })
})

// 获取歌曲对应的歌词
apiRoutes.get('/lyric', function (req, res) {
  var url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'
  axios
    .get(url, {
      headers: {
        referer: 'https://c.y.qq.com/',
        host: 'c.y.qq.com'
      },
      params: req.query
    })
    .then((response) => {
      let ret = response.data
      if (typeof ret === 'string') {
        const reg = /{.*}/
        const matches = ret.match(reg)
        if (matches) {
          ret = JSON.parse(matches[0])
        }
      }
      res.json(ret)
    })
    .catch((e) => {
      console.log(e)
    })
})

// 根据关键字搜索歌曲
apiRoutes.get('/search', function (req, res) {
  var url = 'https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp'
  axios
    .get(url, {
      headers: {
        referer: 'https://c.y.qq.com/',
        host: 'c.y.qq.com'
      },
      params: req.query
    })
    .then((response) => {
      let ret = response.data
      if (typeof ret === 'string') {
        const reg = /{.*}/
        const matches = ret.match(reg)
        if (matches) {
          ret = JSON.parse(matches[0])
        }
      }
      res.json(ret)
    })
    .catch((e) => {
      console.log(e)
    })
})

app.use('/api', apiRoutes)
app.listen(3000)

var compiler = webpack(webpackConfig)

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {
  }
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({action: 'reload'})
    cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = {target: options}
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
