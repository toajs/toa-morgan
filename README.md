toa-morgan
====
HTTP request logger middleware for Toa.

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads][downloads-image]][downloads-url]

> Modified from https://github.com/expressjs/morgan

## Examples

### simple toa server

Simple app that will log all request in the Apache combined format to STDOUT

```js
var Toa = require('toa')
var toaMorgan = require('toa-morgan')

var app = Toa(function () {
  this.body = 'Hello!'
})

app.use(toaMorgan())

app.listen(3000)
```

### write logs to a file

Simple app that will log all requests in the Apache combined format to the file
`access.log`.

```js
var fs = require('fs')
var Toa = require('toa')
var toaMorgan = require('toa-morgan')

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})

var app = Toa(function () {
  this.body = 'Hello!'
})

app.use(toaMorgan('common', {stream: accessLogStream}))

app.listen(3000)
```

### use custom token formats

Sample app that will use custom token formats. This adds an ID to all requests and displays it using the `:id` token.

```js
var Toa = require('toa')
var uuid = require('uuid')
var toaMorgan = require('toa-morgan')

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
```

## API

```js
var morgan = require('toa-morgan')
```

### morgan([format, options])

Create a new morgan logger middleware function using the given `format` and `options`.
The `format` argument may be a string of a predefined name (see below for the names),
a string of a format string, or a function that will produce a log entry.

#### Options

Morgan accepts these properties in the options object.

#### immediate

Write log line on request instead of response. This means that a requests will
be logged even if the server crashes, _but data from the response (like the
response code, content length, etc.) cannot be logged_.

##### skip

Function to determine if logging is skipped, defaults to `false`. This function
will be called as `skip.call(context)`.

```js
// EXAMPLE: only log error responses
morgan('combined', {
  skip: function () {
    return this.status < 400
  }
})
```

##### stream

Output stream for writing log lines, defaults to `process.stdout`.

#### Predefined Formats

There are various pre-defined formats provided:

##### combined

Standard Apache combined log output. It is default format.

```
:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
```

##### common

Standard Apache common log output.

```
:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
```

##### dev

Concise output colored by response status for development use. The `:status`
token will be colored red for server error codes, yellow for client error
codes, cyan for redirection codes, and uncolored for all other codes.

```
:method :url :status :response-time ms - :res[content-length]
```

##### tiny

The minimal output.

```
:method :url :status :res[content-length] - :response-time ms
```

#### Tokens

##### Creating new tokens

To define a token, simply invoke `morgan.token` with the name and a callback function. This callback function is expected to return a string value. The value returned is then available as ":type" in this case:
```js
morgan.token('type', function () {
  return this.get('content-type')
})
```

Calling `morgan.token` using the same name as an existing token will overwrite that token definition.

##### :date[format]

The current date and time in UTC. The available formats are:

  - `clf` for the common log format (`"10/Oct/2000:13:55:36 +0000"`)
  - `iso` for the common ISO 8601 date time format (`2000-10-10T13:55:36.000Z`)
  - `web` for the common RFC 1123 date time format (`Tue, 10 Oct 2000 13:55:36 GMT`)

If no format is given, then the default is `web`.

##### :http-version

The HTTP version of the request.

##### :method

The HTTP method of the request.

##### :referrer

The Referrer header of the request. This will use the standard mis-spelled Referer header if exists, otherwise Referrer.

##### :remote-addr

The remote address of the request. This will use `this.ip`.

##### :remote-user

The user, default is `"-"`.

##### :req[header]

The given `header` of the request.

##### :res[header]

The given `header` of the response.

##### :response-time

The time between the request coming into `morgan` and when the response
headers are written, in milliseconds.

##### :status

The status code of the response.

If the request/response cycle completes before a response was sent to the
client (for example, the TCP socket closed prematurely by a client aborting
the request), then the status will be empty (displayed as `"-"` in the log).

##### :url

The URL of the request. This will use `this.originalUrl`.

##### :user-agent

The contents of the User-Agent header of the request.

## Licences
(The MIT License)

[npm-url]: https://npmjs.org/package/toa-morgan
[npm-image]: http://img.shields.io/npm/v/toa-morgan.svg

[travis-url]: https://travis-ci.org/toajs/toa-morgan
[travis-image]: http://img.shields.io/travis/toajs/toa-morgan.svg

[downloads-url]: https://npmjs.org/package/toa-morgan
[downloads-image]: http://img.shields.io/npm/dm/toa-morgan.svg?style=flat-square
