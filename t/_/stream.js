var missi = require('mississippi')
var Toranoana = require('../www.toranoana.jp')
var tora = new Toranoana
var s = tora.createStream()

missi.pipe(
  s,
  missi.through.obj((o, _, done) => {
    console.log(o)
    done()
  }),
  err => console.log(err || '!! ended')
)

s.end({category: 'mak', value: 'MTSP'})
