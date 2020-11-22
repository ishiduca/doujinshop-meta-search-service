var xtend = require('xtend')
var inherits = require('inherits')
var trumpet = require('trumpet')
var urlencode = require('urlencode')
var { pipe, duplex, through, concat } = require('mississippi')
var Service = require('./service')

function EcToranoanaJp () {
  if (!(this instanceof EcToranoanaJp)) return new EcToranoanaJp()
  var { urlencode, backoff, hyperquest } = Service.defaultConfig
  var serviceHome = 'https://ec.toranoana.jp'
  var searchHome = `${serviceHome}/tora_r/ec/app/catalog/list/`
  var cookie = 'adflg=0'
  var headers = xtend(hyperquest.headers, { cookie })
  var config = xtend({
    url: { serviceHome, searchHome },
    urlencode: xtend(urlencode),
    backoff: xtend(backoff),
    hyperquest: xtend(hyperquest, { headers })
  })
  Service.call(this, config)
}

inherits(EcToranoanaJp, Service)
module.exports = EcToranoanaJp

EcToranoanaJp.prototype.createURI = function createURI (params) {
  var { category, value, opts } = params
  var maps = {
    mak: 'searchMaker',
    act: 'searchActor',
    nam: 'searchCommodityName',
    mch: 'searchChara',
    gnr: 'searchWord',
    kyw: 'searchWord',
    com: 'searchWord'
  }
  var query = xtend({
    searchCategoryCode: '04',
    // searchChildrenCategoryCode: 'cot',
    searchBackorderFlg: 0,
    searchUsedItemFlg: 1,
    searchDisplay: 12,
    detailSearch: true
  }, { [maps[category]]: value }, opts)

  return (
    this.config.url.searchHome +
      '?' + urlencode.stringify(query, this.config.urlencode)
  )
}

EcToranoanaJp.prototype.createOpts = function createOpts (params) {
  return xtend({
    method: this.config.hyperquest.method,
    headers: xtend(this.config.hyperquest.headers)
  })
}

EcToranoanaJp.prototype.scraper = function scraper () {
  var sink = trumpet()
  var source = through.obj()
  var isBingo = false
  var count = 0
  var selector = '#search-result-container.pull-right div' +
    ' ul.list li.list__item div.search-result-inside-container'
  var serviceHome = this.config.url.serviceHome

  sink.selectAll(selector, div => {
    isBingo = true
    count += 1
    var tr = trumpet()
    var _ = {}
    var links = []

    tr.select('.product_img a img', img => {
      img.getAttribute('data-src', src => {
        _.thumbnail = { src }
      })
    })

    tr.select('.product_desc section .product_title a', a => {
      var tr = trumpet()
      a.getAttribute('href', href => {
        _.uri = serviceHome + href
      })
      pipe(
        a.createReadStream(),
        tr,
        concat(buf => {
          var title = String(buf)
            .replace(/\s/g, '').replace(/\r/g, '').replace(/\n/g, '')
          _.title = title
        }),
        error => {
          if (error) source.emit('error', error)
        }
      )
    })

    tr.selectAll('.product_desc section ul[class^="product_"] li a', a => {
      var link = {}
      a.getAttribute('href', href => (link.href = serviceHome + href))
      var tr = trumpet()
      pipe(
        a.createReadStream(),
        tr,
        concat(buf => {
          var title = String(buf).replace(/<[^>]+?>/g, '')
          link.title = title
        }),
        error => {
          if (error) source.emit('error', error)
          links.push(link)
        }
      )
    })

    pipe(
      div.createReadStream(),
      tr,
      error => {
        if (error) source.emit('error', error)
      }
    )

    tr.once('end', () => {
      source.write({ links, ..._ })
      if ((count -= 1) === 0) source.end()
    })
  })

  sink.once('end', () => (isBingo || source.end()))

  return duplex.obj(sink, source)
}
