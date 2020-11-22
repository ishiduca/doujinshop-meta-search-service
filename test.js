const test = require('tape')
const xtend = require('xtend')
const Service = require('service')
const defaultConfig = {
  urlencode: { charset: 'utf8' },
  backoff: { failAfter: 10 },
  hyperquest: {
    method: 'GET',
    headers: {
      'user-agent': 'hyperquest/2.13'
    }
  },
  url: {
    serviceHome: null,
    searchHome: null
  }
}

test('can load module', t => {
  t.plan(1)
  t.ok(Service, 'const Service = require("doujinshop-meta-search-service")')
})

test('exists Service.defaultConfig', t => {
  t.plan(1)
  t.deepEqual(Service.defaultConfig, defaultConfig, 'exsits Service.defaultConfig')
})

test('new Service(config)でインスタンスを生成できるか', t => {
  t.plan(1)
  const client = new Service()
  t.ok(client instanceof Service, 'client instanceof Service')
})

test('Service(config)でインスタンスを生成できるか', t => {
  t.plan(1)
  const client = Service()
  t.ok(client instanceof Service, 'client instanceof Service')
})

test('第一引数を指定しなくても、インスタンスはconfigを持つか', t => {
  t.plan(1)
  const client = new Service()
  t.deepEqual(client.config, defaultConfig, 'client.config = { hyperquest, urlencode, backoff, url }')
})

test('第一引数に { url: { serviceHome: "..." } } と指定して、インスタンスは変更されたconfigをもつか（また、変更されていないメンバは変更されないで保持しているか）', t => {
  t.plan(1)
  const serviceHome = 'https://hoge.org'
  const searchHome = null
  const expected = {
    urlencode: xtend(defaultConfig.urlencode),
    backoff: xtend(defaultConfig.backoff),
    hyperquest: xtend(defaultConfig.hyperquest),
    url: { serviceHome, searchHome }
  }
  const client = Service({ url: { serviceHome } })
  t.deepEqual(client.config, expected, `client.config.url.serviceHome eq "${client.config.url.serviceHome}"`)
})

var fs = require('fs')
var path = require('path')
var { through, pipe } = require('mississippi')
var Foo = require('./example')

test('実装例', t => {
  var html = path.join(__dirname, 'data/result.html')
  Foo.prototype.makeRequest = function (params, done) {
    done(null, fs.createReadStream(html))
  }

  var foo = new Foo()

  t.test('client.request({ category, value, opts }, (error, resultsList) => { ... })', tt => {
    foo.request({ dummy: true }, (error, resultsList) => {
      tt.notOk(error, 'no exists error')
      tt.is(resultsList.length, 24, 'resultsList length 24')
      tt.end()
    })
  })

  t.test('var duplexStream = client.createDuplex()', tt => {
    var dup = foo.createDuplex()
    var spy = []
    pipe(
      dup,
      through.obj((data, _, done) => {
        spy.push(data)
        done()
      }),
      error => {
        tt.notOk(error, 'no exsits error')
        tt.is(spy.length, 24)
        tt.end()
      }
    )
    dup.end({ dummy: true })
  })
  t.end()
})
