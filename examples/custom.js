'use strict'
// **Github:** https://github.com/toajs/toa-morgan
//
// **License:** MIT
var Toa = require('toa')
var uuid = require('uuid')
var toaMorgan = require('../')

toaMorgan.token('id', function () {
  return this.state.id
})

var app = Toa(function () {
  this.body = 'Hello!'
})

app.use(toaMorgan(':id :method :url :response-time'))
app.use(function (next) {
  this.state.id = uuid.v4()
  next()
})

app.listen(3000)
