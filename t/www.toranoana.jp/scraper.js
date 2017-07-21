var trumpet = require('trumpet')
var missi = require('mississippi')
var xtend = require('xtend')
// var defaultObject = require('../common-result-object')

var WWWTORANOANAJP = 'http://www.toranoana.jp'
// var reg = /<div><a href="(\/mailorder\/article\/[^"]+)"><img src="(https?:\/\/img\.toranoana\.jp\/[^"]+)".*?><\/a><\/div>.+?<p class="title">(.*?)<\/p>.+?<p class="info">.*?<a href="([^"]+?)">(?:<img.*?>)?(.+?)<\/a>/
var temp = `
  <div>
    <a href="(\/mailorder\/article\/[^"]+)">
      <img src="(https?:\/\/img\.toranoana\.jp\/[^"]+)".*?>
    <\/a>
  <\/div>
  .+?
  <p class="title">(.*?)<\/p>
  .+?
  <p class="info">.*?<a href="([^"]+?)">(?:<img.*?>)?(.+?)<\/a>
`

var reg = new RegExp(temp.replace(/\s{2,}/g, '').replace(/\n/g, ''))

module.exports = function scrape () {
  var tr = trumpet()
  var rs = missi.through.obj()

  var c = 0
  var isEnd

  tr.selectAll('li', li => {
    var bufs = []
    c += 1
    li.createReadStream().pipe(missi.through((b, _, done) => {
      bufs.push(b)
      done()
    }, done => {
      var str = Buffer.isBuffer(bufs[0]) ? String(Buffer.concat(bufs)) : bufs.join('')
      str = str.replace(/\n/g, '').replace(/>(\s+)</g, '><')
      var opt = xtend({})
      var result = str.match(reg)
      if (result) {
        opt = xtend(opt, {
          urlOfTitle: WWWTORANOANAJP + result[1],
          urlOfCircle: WWWTORANOANAJP + result[4].trim(),
          srcOfThumbnail: result[2],
          title: result[3],
          circle: result[5]
        })
      }
      rs.write(opt)
      done()
    }))
  })

  tr.once('finish', () => (c === 0 && end()))
  tr.once('end', () => (isEnd || end()))

  function end () {
    ;(isEnd = true) && rs.end()
  }

  return missi.duplex.obj(tr, rs)
}
