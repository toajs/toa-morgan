'use strict'
// **Github:** https://github.com/toajs/toa-morgan
//
// **License:** MIT
const Toa = require('toa')
const toaMorgan = require('../index')

const app = new Toa()
app.use(toaMorgan())
app.use(function () {
  this.body = 'Hello!'
})

app.listen(3000)
