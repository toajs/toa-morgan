'use strict'
// **Github:** https://github.com/toajs/toa-morgan
//
// **License:** MIT
// Modified from https://github.com/expressjs/morgan

module.exports = toaMorgan

/**
 * Create a logger middleware.
 *
 * @param {String|Function} format
 * @param {Object} [options]
 * @return {Function} middleware
 * @public
 */
function toaMorgan (format, options) {
  format = format || 'combined'
  options = options || {}

  // output on request instead of response
  var immediate = !!options.immediate
  // check if log entry should be skipped
  var skip = typeof options.skip === 'function' ? options.skip : null
  // format function
  var formatLine = compile(formats[format] || format)
  // stream
  var stream = options.stream || process.stdout

  return function logger (done) {
    this._startTime = Date.now()
    this._endTime = 0

    if (immediate) logRequest.call(this)
    else this.on('end', handle).on('finished', handle)

    done()
  }

  function handle () {
    this.removeListener('end', handle).removeListener('finished', handle)
    this._endTime = Date.now()
    logRequest.call(this)
  }

  function logRequest () {
    if (skip && skip.call(this)) return
    var line = formatLine.call(this)
    if (line != null) stream.write(line + '\n')
  }
}

/**
 * Define a format with the given name.
 *
 * @param {string} name
 * @param {string|function} format
 * @public
 */
var formats = Object.create(null)
toaMorgan.format = function (name, format) {
  var type = typeof format
  if (type !== 'string' && type !== 'function') {
    throw new TypeError('argument format must be a string or a function')
  }
  formats[name] = format
  return toaMorgan
}

/**
 * Define a token function with the given name,
 * and callback fn() with toa context.
 *
 * @param {string} name
 * @param {function} fn
 * @public
 */
var tokens = Object.create(null)
toaMorgan.token = function (name, fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('argument fn must be a function')
  }
  tokens[name] = fn
  return toaMorgan
}

/**
 * Apache combined log format.
 */
toaMorgan.format('combined', ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"')

/**
 * Apache common log format.
 */
toaMorgan.format('common', ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]')

/**
 * Short format.
 */
toaMorgan.format('short', ':remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms')

/**
 * Tiny format.
 */
toaMorgan.format('tiny', ':method :url :status :res[content-length] - :response-time ms')

/**
 * dev (colored)
 */
toaMorgan.format('dev', function developmentFormatLine () {
  // get the status code if response written
  var status = this.status
  // get status color
  var color = status >= 500 ? 31 // red
    : status >= 400 ? 33 // yellow
    : status >= 300 ? 36 // cyan
    : status >= 200 ? 32 // green
    : 0 // no color

  // get colored function
  var fn = developmentFormatLine[color]

  if (!fn) {
    // compile
    var format = '\x1b[0m:method :url \x1b[' + color +
      'm:status \x1b[0m:response-time ms - :res[content-length]\x1b[0m'
    fn = developmentFormatLine[color] = compile(format)
  }

  return fn.call(this)
})

/**
 * request url
 */
toaMorgan.token('url', function () {
  return this.originalUrl
})

/**
 * request method
 */
toaMorgan.token('method', function () {
  return this.method
})

/**
 * response time in milliseconds
 */
toaMorgan.token('response-time', function () {
  return this._endTime ? (this._endTime - this._startTime) : '-'
})

/**
 * current date
 */
toaMorgan.token('date', function (format) {
  var date = this._endTime ? new Date(this._endTime) : new Date()

  switch (format || 'web') {
    case 'clf':
      return clfdate(date)
    case 'iso':
      return date.toISOString()
    case 'web':
      return date.toUTCString()
  }
})

/**
 * response status code
 */
toaMorgan.token('status', function () {
  return this.res.headersSent ? this.status : '-'
})

/**
 * normalized referrer
 */
toaMorgan.token('referrer', function () {
  return this.get('referrer')
})

/**
 * remote address
 */
toaMorgan.token('remote-addr', function () {
  return this.ip
})

/**
 * remote user
 */
toaMorgan.token('remote-user', function () {
  return '-'
})

/**
 * HTTP version
 */
toaMorgan.token('http-version', function () {
  return this.req.httpVersion
})

/**
 * UA string
 */
toaMorgan.token('user-agent', function () {
  return this.get('user-agent')
})

/**
 * request header
 */
toaMorgan.token('req', function (field) {
  var header = this.get(field)
  return Array.isArray(header) ? header.join(', ') : header
})

/**
 * response header
 */
toaMorgan.token('res', function (field) {
  var header = this.response.get(field)
  return Array.isArray(header) ? header.join(', ') : header
})

/**
 * Compile a format string into a function.
 *
 * @param {string} format
 * @return {function}
 * @private
 */
var regex = /:([-\w]{2,})(?:\[([^\]]+)\])?/
function compile (str) {
  if (typeof str === 'function') return str
  if (typeof str !== 'string') throw new TypeError('argument format must be a string')

  var fns = []
  var tokenFn = 0
  var res = regex.exec(str)

  while (res) {
    if (res.index) fns.push(compileStr(str.slice(0, res.index)))
    tokenFn++
    fns.push(compileToken(res[1], res[2]))
    str = str.slice(res.index + res[0].length)
    res = regex.exec(str)
  }

  if (!tokenFn) throw new Error(str + ' is invalid format(no token)')
  if (str) fns.push(compileStr(str))

  return function () {
    var ctx = this
    return fns.reduce(function (log, fn) {
      return log + toStr(fn.call(ctx))
    }, '')
  }
}

/**
 * Compile a token string into a function.
 *
 * @param {string} token
 * @param {string} arg
 * @return {function}
 * @private
 */
function compileToken (token, arg) {
  var fn = tokens[token] || noOp

  return function () {
    return arg ? fn.call(this, arg) : fn.call(this)
  }
}

/**
 * Wrap a string into a function that return the string.
 *
 * @param {string} str
 * @return {function}
 * @private
 */
function compileStr (str) {
  return function () {
    return str
  }
}

/**
 * Format a Date in the common log format.
 *
 * @param {Date} dateTime
 * @return {string}
 * @private
 */
var clfmonth = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]
function clfdate (dateTime) {
  var date = dateTime.getUTCDate()
  var hour = dateTime.getUTCHours()
  var mins = dateTime.getUTCMinutes()
  var secs = dateTime.getUTCSeconds()
  var year = dateTime.getUTCFullYear()

  var month = clfmonth[dateTime.getUTCMonth()]

  return pad2(date) + '/' + month + '/' + year + ':' +
    pad2(hour) + ':' + pad2(mins) + ':' + pad2(secs) + ' +0000'
}

/**
 * Pad number to two digits.
 *
 * @param {number} num
 * @return {string}
 * @private
 */
function pad2 (num) {
  var str = String(num)
  return (str.length === 1 ? '0' : '') + str
}

/**
 * convert value to string.
 *
 * @param {any} value
 * @return {string}
 * @private
 */
function toStr (value) {
  if (typeof value !== 'string' && value != null) value = String(value)
  return value || '-'
}

function noOp () {}
