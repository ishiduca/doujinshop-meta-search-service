var inherits = require('inherits')
var Service = require('../index')

inherits(Toranoana, Service)
module.exports = Toranoana

function Toranoana () {
  Service.call(this, 'www.toranoana.jp', {
    charset: 'CP932',
    failAfter: 5,
    searchHome: 'http://www.toranoana.jp/cgi-bin/R2/d_search.cgi'
  })
}
