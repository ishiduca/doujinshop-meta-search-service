var xtend = require('xtend')
var valid = require('is-my-json-valid')
var backoff = require('backoff')
var hyperquest = require('hyperquest')
var { pipe, concat, through, duplex } = require('mississippi')
var schemaForConfig = require('./schema-config')
var schemaForParams = require('./schema-params')
var defaultConfig = {
  urlencode: require('./config-urlencode'),
  backoff: require('./config-backoff'),
  hyperquest: require('./config-hyperquest'),
  url: require('./config-url')
}

module.exports = Service

function Service (_config) {
  if (!(this instanceof Service)) return new Service(_config)
  _config || (_config = {})
  var config = {
    urlencode: xtend(defaultConfig.urlencode, _config.urlencode),
    backoff: xtend(defaultConfig.backoff, _config.backoff),
    hyperquest: xtend(defaultConfig.hyperquest, _config.hyperquest),
    url: xtend(defaultConfig.url, _config.url)
  }
  var v = valid(schemaForConfig)
  if (!v(config, { verborse: true })) {
    throw customError(
      new TypeError('Invalid Config'),
      { errors: v.errors, _: config }
    )
  }
  this.config = config
  this.schemaForParams = schemaForParams
}

Service.defaultConfig = defaultConfig

Service.prototype.createDuplex = function createDuplex () {
  var source = through.obj()
  var sink = through.obj((params, _, done) => {
    this.makeRequest(params, (error, response) => {
      if (error) return done(error)
      pipe(
        response,
        this.scraper(),
        source,
        done
      )
    })
  })

  return duplex.obj(sink, source)
}

Service.prototype.request = function request (params, done) {
  this.makeRequest(params, (error, response) => {
    if (error) return done(error)
    pipe(
      response,
      this.scraper(),
      concat(results => done(null, results)),
      error => (error && done(error))
    )
  })
}

Service.prototype.makeRequest = function makeRequest (params, done) {
  this.validateRequestParams(params, (error, params) => {
    if (error) return done(error)
    var call = this._makeRequest(params, done)
    call.retryIf(error => /ENOTFOUND/.test(String(error)))
    call.failAfter(this.config.backoff.failAfter)
    call.start()
  })
}

Service.prototype._makeRequest = function _makeRequest (params, done) {
  var uri = this.createURI(params)
  var opts = this.createOpts(params)
  return backoff.call(hyperquest, uri, opts, done)
}

Service.prototype.validateRequestParams = function (params, done) {
  var v = valid(this.schemaForParams)
  if (!v(params, { verbose: true })) {
    return done(
      customError(
        new TypeError('Invalid Params'),
        { errors: v.errors, _: params },
        'ValidateRequestParamsError'
      )
    )
  }
  done(null, params)
}

Service.prototype.createURI = function createURI (params) {
  throw new Error('.createURI method must implement yourself.')
}

Service.prototype.createOpts = function createOpts (params) {
  throw new Error('.createOpts method must implement yourself.')
}

Service.prototype.scraper = function scraper () {
  throw new Error('.scraper method must implement yourself.')
}

function customError (message, data, name) {
  var error = (
    (message instanceof Error)
      ? message
      : new Error(message)
  )
  name && (error.name = name)
  error.data = data
  error.toJSON || (error.toJSON = function toJSON () {
    return {
      message: this.message,
      data: this.data
    }
  })
  return error
}
