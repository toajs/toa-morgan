'use strict'
// **Github:** https://github.com/toajs/toa-morgan
//
// **License:** MIT
var Toa = require('toa')
var toaMorgan = require('../index')

var app = Toa(function () {
  this.body = 'Hello!'
})

app.use(toaMorgan())

app.listen(3000)
