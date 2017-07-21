var xtend = require('xtend')
var iconv = require('iconv-lite')
var backoff = require('backoff')
var urlencode = require('urlencode')
var hyperquest = require('hyperquest')
var missi = require('mississippi')

module.exports = Service

function Service (name, _opt) {
  if (!(this instanceof Service)) return new Service(name, _opt)
  if (!name || typeof name !== 'string') throw new Error('"name" not found')
  var opt = xtend(_opt)
  if (!opt.searchHome) throw new Error('"searchHome" not found')
  this.name = name
  this.charset = opt.charset || 'utf8'
  this.failAfter = opt.failAfter || 7
  this.searchHome = opt.searchHome || ''
}

Service.prototype.createStream = function (requestOpt) {
  var me = this
  return missi.through.obj(function (params, _, done) {
    var qstr = me.createQuery(params)
    var buf = []

    missi.pipe(
      me.request(qstr, requestOpt),
      iconv.decodeStream(me.charset),
      me.scraper(),
      missi.through.obj(function (o, _, d) {
        buf.push(o)
        d()
      }),
      function onEnd (err) {
        if (err) {
          err.service = me.name
          err.request = me.searchHome + '?' + qstr
          done(err)
        } else {
          done(null, {
            service: me.name,
            request: me.searchHome + '?' + qstr,
            list: buf
          })
        }
      }
    )
  })
}

Service.prototype.request = function (qstr, requestOpt) {
  var t = missi.through()
  var call = this._request(qstr, requestOpt, onResponse)

  call.retryIf(retryIf)
  call.failAfter(this.failAfter)
  call.start()

  return t

  function retryIf (err) {
    return String(err.statusCode.slice(0, 1)) === '5'
  }

  function onResponse (err, res) {
    if (err) t.emit('error', err)
    else res.pipe(t)
  }
}

Service.prototype._request = function (qstr, requestOpt, onResponse) {
  var uri = this.searchHome + '?' + qstr
  return backoff.call(hyperquest, uri, xtend(requestOpt), onResponse)
}

Service.prototype.createQuery = function (params) {
  var opt = {charset: this.charset}
  return urlencode.stringify(this.transformQuery(params), opt)
}

Service.prototype.transformQuery = function (params) {
  throw new Error('"transformQuery" method needs to be implemented' +
                  ' by the application developer')
}

Service.prototype.scraper = function () {
  throw new Error('"scraper" method needs to be implemented' +
                  ' by the application developer')
}
