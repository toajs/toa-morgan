'use strict'
// **Github:** https://github.com/toajs/toa-morgan
//
// **License:** MIT
const Toa = require('toa')
const uuid = require('uuid')
const toaMorgan = require('../')

toaMorgan.token('id', function () {
  return this.state.id
})

const app = new Toa()
app.use(toaMorgan(':id :method :url :response-time'))
app.use(function (next) {
  this.state.id = uuid.v4()
  next()
})
app.use(function () {
  this.body = 'Hello!'
})

app.listen(3000)
