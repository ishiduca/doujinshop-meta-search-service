var test = require('tape')
var fs = require('fs')
var path = require('path')
var xtend = require('xtend')
var missi = require('mississippi')
var iconv = require('iconv-lite')
var service = require('../index')
var Toranoana = require('./toranoana')

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
