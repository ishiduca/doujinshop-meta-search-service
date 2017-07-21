# doujinshop-meta-search-service

## example

実装例

```js
var Service = require('doujinshop-meta-search-service')
var inherits = require('inherits')
var xtend = require('xtend')

module.exports = Toranoana
inherits(Toranoana, Service)

function Toranoana () {
  Service.call(this, 'www.toranoana.jp', {
    charset: 'CP932',
    failAfter: 5,
    searchHome: 'http://www.toranoana.jp/cgi-bin/R2/d_search.cgi'
  })
}

Toranoana.prototype.transformQuery = function (_params) {
  var params = xtend(_params)
  var q = {}; q[params.category] = params.value

  delete params.category
  delete params.value

  return xtend({
    item_kind: '0401',
    bl_flg: 0,
    adl: 0,
    obj: 0,
    stk: 1,
    img: 1,
    ps: 1
  }, q, params)
}

Toranoana.prototype.scraper = function () {
  // see t/www.toranoana.jp/scraper.js
}
```

使用例

```js
var missi = require('mississippi')
var Toranoana = require('toranonana')
var tora = new Toranoana
var ts = tora.createStream()

missi.pipe(
  ts,
  missi.through.obj((res, _, done) => {
    console.log(res)
    done()
  }),
  err => console.log(err || 'meta search ended')
)

ts.end({
  category: 'mak',
  value: 'MTSP'
})
```


