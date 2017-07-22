var Service = require('../../index')
var xtend = require('xtend')
var inherits = require('inherits')

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

Toranoana.prototype.scraper = require('./scraper')
