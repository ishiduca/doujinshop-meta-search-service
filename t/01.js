var test = require('tape')
var fs = require('fs')
var path = require('path')
var xtend = require('xtend')
var missi = require('mississippi')
var iconv = require('iconv-lite')
var service = require('../index')
var Toranoana = require('./www.toranoana.jp')

test('var service = new Service(name, opt)', t => {
  t.throws(function () {
    service('www.toranoana.jp', {
      charset: 'CP932',
      failAfter: 5
    })
  }, /"searchHome" not found/, '"searchHome" not found')
  t.throws(function () {
    service({
      charset: 'CP932',
      failAfter: 5,
      searchHome: '/cgi-bin/R2/d_search.cgi'
    })
  }, /"name" not found/, '"name" not found')

  var s = new Toranoana
  t.is(s.charset, 'CP932', '.charset eq "CP932"')
  t.is(s.failAfter, 5, '.failAfter === 5')
  t.is(s.searchHome, 'http://www.toranoana.jp/cgi-bin/R2/d_search.cgi', '.searchHome eq "http://www.toranoana.jp/cgi-bin/R2/d_search.cgi"')

  t.end()
})

test('queryStr = service.createQuery(params)', t => {
  var tora = new Toranoana
  var params = {
      category: 'mak',
      value: '床子屋',
      ps: 2
    }

  t.test('queryObj = service.transformQuery(params)', tt => {
    var qo = tora.transformQuery(params)
    tt.deepEqual(qo, {
      item_kind: '0401',
      bl_flg: 0,
      adl: 0,
      obj: 0,
      stk: 1,
      img: 1,
      ps: 2,
      mak: '床子屋'
    }, `{
      item_kind: '0401',
      bl_flg: 0,
      adl: 0,
      obj: 0,
      stk: 1,
      img: 1,
      ps: 2,
      mak: '床小屋'
    }`)
    tt.end()
  })

  var qs = tora.createQuery(params)
  t.ok(/mak=%8F%B0%8E%71%89%AE/.test(qs), qs)
  t.end()
})

test('stream = service.scraper()', t => {
  var html = path.join(__dirname, 'tokoya.html')
  var tora = new Toranoana
  var b = []
  missi.pipe(
    fs.createReadStream(html),
    iconv.decodeStream(tora.charset),
    tora.scraper(),
    missi.through.obj((o, _, d) => {
      b.push(o)
      d()
    }),
    err => {
      t.notOk(err, 'no exists error')
      t.is(b.length, 50, 'items length 50')
      t.deepEqual(b[0], {
        urlOfTitle: 'http://www.toranoana.jp/mailorder/article/04/0030/53/41/040030534152.html',
        urlOfCircle: 'http://www.toranoana.jp/cgi-bin/R2/d_search.cgi?bl_fg=0&item_kind=0401&mak=%8f%b0%8eq%89%ae&img=1&stk=1&makAg=1&p1=35&p2=67&p3=5730303136373335',
        srcOfThumbnail: 'http://img.toranoana.jp/img18/04/0030/53/41/040030534152-1r.gif',
        title: '暗い家 大好きな先輩のお家には、知らないおじさんが住んでました。',
        circle: '床子屋'
      }, `{
        urlOfTitle: 'http://www.toranoana.jp/mailorder/article/04/0030/53/41/040030534152.html',
        urlOfCircle: 'http://www.toranoana.jp/cgi-bin/R2/d_search.cgi?bl_fg=0&item_kind=0401&mak=%8f%b0%8eq%89%ae&img=1&stk=1&makAg=1&p1=35&p2=67&p3=5730303136373335',
        srcOfThumbnail: 'http://img.toranoana.jp/img18/04/0030/53/41/040030534152-1r.gif',
        title: '暗い家 大好きな先輩のお家には、知らないおじさんが住んでました。',
        circle: '床子屋'
      }`)
      t.deepEqual(b[49], {
        urlOfTitle: 'http://www.toranoana.jp/mailorder/article/04/0010/16/02/040010160231.html',
        urlOfCircle: 'http://www.toranoana.jp/cgi-bin/R2/d_search.cgi?bl_fg=0&item_kind=0401&mak=%8f%b0%8eq%89%ae&img=1&stk=1&makAg=1&p1=35&p2=67&p3=5730303136373335',
        srcOfThumbnail: 'http://img.toranoana.jp/img18/04/0010/16/02/040010160231-1r.gif',
        title: 'ニーナさんが大変なことになる本。4',
        circle: '床子屋'
      }, `{
        urlOfTitle: 'http://www.toranoana.jp/mailorder/article/04/0010/16/02/040010160231.html',
        urlOfCircle: 'http://www.toranoana.jp/cgi-bin/R2/d_search.cgi?bl_fg=0&item_kind=0401&mak=%8f%b0%8eq%89%ae&img=1&stk=1&makAg=1&p1=35&p2=67&p3=5730303136373335',
        srcOfThumbnail: 'http://img.toranoana.jp/img18/04/0010/16/02/040010160231-1r.gif',
        title: 'ニーナさんが大変なことになる本。4',
        circle: '床子屋'
      }`)
      t.end()
    }
  )
})
