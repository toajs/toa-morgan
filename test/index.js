'use strict'
// **Github:** https://github.com/toajs/toa-morgan
//
// modified from https://github.com/expressjs/morgan/blob/master/test/morgan.js
// **License:** MIT

/*global describe, it*/

var assert = require('assert')
var Toa = require('toa')
var morgan = require('..')
var split = require('split')
var request = require('supertest')

describe('toa-morgan', function () {
  describe('arguments', function () {
    it('should use default format', function (done) {
      var cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.strictEqual(res.text.length > 0, true)
        assert.strictEqual(line.substr(0, res.text.length), res.text)
        done()
      })

      var stream = createLineStream(function (line) {
        cb(null, null, line)
      })

      request(createServer(undefined, {stream: stream}))
        .get('/')
        .expect(200, cb)
    })

    describe('format', function () {
      it('should accept format as format name', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert(/^GET \/ 200 \d+ - \d+ ms$/.test(line))
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('tiny', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should accept format as format string', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'GET /')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':method :url', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should accept format as function', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'GET / 200')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        function format () {
          return [this.method, this.url, this.status].join(' ')
        }

        request(createServer(format, {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should reject format as bool', function () {
        assert.throws(createServer.bind(null, true), /argument format/)
      })
    })
  })

  describe('tokens', function () {
    describe(':date', function () {
      it('should get current date in "web" format by default', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(line))
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should get current date in "clf" format', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} \+0000$/.test(line))
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date[clf]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should get current date in "iso" format', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(line))
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date[iso]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should get current date in "web" format', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(line))
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date[web]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should be blank for unknown format', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '-')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date[bogus]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    describe(':http-version', function () {
      it('should be 1.0 or 1.1', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^1\.[01]$/.test(line))
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':http-version', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    describe(':req', function () {
      it('should get request properties', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'me')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':req[x-from-string]', {stream: stream}))
          .get('/')
          .set('x-from-string', 'me')
          .expect(200, cb)
      })

      it('should display all values of array headers', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'foo=bar, fizz=buzz')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':req[set-cookie]', {stream: stream}))
          .get('/')
          .set('Set-Cookie', ['foo=bar', 'fizz=buzz'])
          .expect(200, cb)
      })
    })

    describe(':res', function () {
      it('should get response properties', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'true')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':res[x-sent]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should display all values of array headers', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'foo, bar')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer(':res[x-keys]', {stream: stream}, function () {
          this.set('X-Keys', ['foo', 'bar'])
          this.body = this.ip
        })

        request(server)
          .get('/')
          .expect('X-Keys', 'foo, bar')
          .expect(200, cb)
      })
    })

    describe(':remote-addr', function () {
      it('should get remote address', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(res.text.length > 0)
          assert.equal(line, res.text)
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':remote-addr', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should work when connection: close', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(res.text.length > 0)
          assert.equal(line, res.text)
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':remote-addr', {stream: stream}))
          .get('/')
          .set('Connection', 'close')
          .expect(200, cb)
      })

      it('should work when connection: keep-alive', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(res.text.length > 0)
          assert.equal(line, res.text)

          res.req.connection.destroy()
          server.close(done)
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer(':remote-addr', {stream: stream}, function () {
          this.body = this.ip
          delete this.req._remoteAddress
        })

        request(server.listen())
          .get('/')
          .set('Connection', 'keep-alive')
          .expect(200, cb)
      })

      it('should not fail if req.connection missing', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(res.text.length > 0)
          assert.equal(line, res.text)

          res.req.connection.destroy()
          server.close(done)
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer(':remote-addr', {stream: stream}, null, function () {
          this.body = this.ip
          delete this.req.connection
        })

        request(server.listen())
          .get('/')
          .set('Connection', 'keep-alive')
          .expect(200, cb)
      })
    })

    describe(':remote-user', function () {
      it('should be empty if none present', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '-')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':remote-user', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    describe(':response-time', function () {
      it('should be in milliseconds', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var end = Date.now()
          var ms = parseFloat(line) || 0
          assert(ms >= 0)
          assert(ms < end - start + 1)
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var start = Date.now()

        request(createServer(':response-time', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should not include response latency', function (done) {
        var end
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var ms = parseFloat(line)
          assert.ok(ms >= 0, 'positive milliseconds')
          assert.ok(ms < end - start + 10, 'response time expected to be < ' + (end - start + 10) + ', but was ' + ms)
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer(':response-time', {stream: stream}, function () {
          var res = this.res
          this.status = 200
          this.respond = false
          res.write('hello, ')
          end = Date.now()

          setTimeout(function () {
            res.end('world!')
          }, 50)
        })

        var start = Date.now()

        request(server)
          .get('/')
          .expect(200, cb)
      })

      it('should be empty before response', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '-')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer(':response-time', {
          immediate: true,
          stream: stream
        })

        request(server)
          .get('/')
          .expect(200, cb)
      })
    })

    describe(':status', function () {
      it('should get response status', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, String(res.statusCode))
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':status', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should not exist before response sent', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '-')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer(':status', {
          immediate: true,
          stream: stream
        })

        request(server)
          .get('/')
          .expect(200, cb)
      })

      it('should not exist for aborted request', function (done) {
        var stream = createLineStream(function (line) {
          assert.equal(line, '-')
          server.close(done)
        })

        var server = createServer(':status', {stream: stream}, function () {
          return function (next) {
            test.abort()
          }
        })

        var test = request(server).post('/')
        test.write('0')
      })
    })

    describe(':url', function () {
      it('should get request URL', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '/foo')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':url', {stream: stream}))
          .get('/foo')
          .expect(200, cb)
      })

      it('should use this.originalUrl if exists', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '/bar')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer(':url', {stream: stream}, function () {
          this.body = this.ip
          this.originalUrl = '/bar'
        })

        request(server)
          .get('/')
          .expect(200, cb)
      })

      it('should not exist for aborted request', function (done) {
        var stream = createLineStream(function (line) {
          assert.equal(line, '-')
          server.close(done)
        })

        var server = createServer(':status', {stream: stream}, function () {
          return function (next) {
            test.abort()
          }
        })

        var test = request(server).post('/')
        test.write('0')
      })
    })
  })

  describe('formats', function () {
    describe('a function', function () {
      it('should log result of function', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'GET / 200')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        function format () {
          return [this.method, this.req.url, this.res.statusCode].join(' ')
        }

        request(createServer(format, {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      it('should not log for undefined return', function (done) {
        var stream = createLineStream(function () {
          throw new Error('should not log line')
        })

        function format (tokens, req, res) {
          return undefined
        }

        request(createServer(format, {stream: stream}))
          .get('/')
          .expect(200, done)
      })

      it('should not log for null return', function (done) {
        var stream = createLineStream(function () {
          throw new Error('should not log line')
        })

        function format (tokens, req, res) {
          return null
        }

        request(createServer(format, {stream: stream}))
          .get('/')
          .expect(200, done)
      })
    })

    describe('combined', function () {
      it('should match expectations', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var masked = line
            .replace(/\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} \+0000/, '_timestamp_')
            .replace(/200 \d+/, '200 -')
          assert.equal(masked, res.text + ' - - [_timestamp_] "GET / HTTP/1.1" 200 - "http://localhost/" "my-ua"')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('combined', {stream: stream}))
          .get('/')
          .set('Referer', 'http://localhost/')
          .set('User-Agent', 'my-ua')
          .expect(200, cb)
      })
    })

    describe('common', function () {
      it('should match expectations', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var masked = line
            .replace(/\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} \+0000/, '_timestamp_')
            .replace(/200 \d+/, '200 -')
          assert.equal(masked, res.text + ' - - [_timestamp_] "GET / HTTP/1.1" 200 -')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('common', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    describe('dev', function () {
      it('should not color 1xx', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_')
          assert.equal(masked.substr(0, 37), '_color_0_GET / _color_0_102 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer('dev', {stream: stream}, function () {
          this.status = 102
        })

        request(server)
          .get('/')
          .expect(102, cb)
      })

      it('should color 2xx green', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_')
          assert.equal(masked.substr(0, 38), '_color_0_GET / _color_32_200 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer('dev', {stream: stream}, function () {
          this.status = 200
          this.body = this.ip
        })

        request(server)
          .get('/')
          .expect(200, cb)
      })

      it('should color 3xx cyan', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_')
          assert.equal(masked.substr(0, 38), '_color_0_GET / _color_36_300 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer('dev', {stream: stream}, function () {
          this.status = 300
        })

        request(server)
          .get('/')
          .expect(300, cb)
      })

      it('should color 4xx yelow', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_')
          assert.equal(masked.substr(0, 38), '_color_0_GET / _color_33_400 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer('dev', {stream: stream}, function () {
          this.status = 400
        })

        request(server)
          .get('/')
          .expect(400, cb)
      })

      it('should color 5xx red', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_')
          assert.equal(masked.substr(0, 38), '_color_0_GET / _color_31_500 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        var server = createServer('dev', {stream: stream}, function () {
          this.status = 500
        })

        request(server)
          .get('/')
          .expect(500, cb)
      })
    })

    describe('short', function () {
      it('should match expectations', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var masked = line.replace(/\d+ ms/, '- ms').replace(/200 \d+/, '200 -')
          assert.equal(masked, res.text + ' - GET / HTTP/1.1 200 - - - ms')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('short', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    describe('tiny', function () {
      it('should match expectations', function (done) {
        var cb = after(2, function (err, res, line) {
          if (err) return done(err)
          var masked = line.replace(/200 \d+/, '200 -').replace(/\d+ ms/, '- ms')
          assert.equal(masked, 'GET / 200 - - - ms')
          done()
        })

        var stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('tiny', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })
  })

  describe('with immediate option', function () {
    it('should not have value for :res', function (done) {
      var cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.equal(line, 'GET / -')
        done()
      })

      var stream = createLineStream(function (line) {
        cb(null, null, line)
      })

      var server = createServer(':method :url :res[x-sent]', {
        immediate: true,
        stream: stream
      })

      request(server)
        .get('/')
        .expect(200, cb)
    })

    it('should not have value for :response-time', function (done) {
      var cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.equal(line, 'GET / -')
        done()
      })

      var stream = createLineStream(function (line) {
        cb(null, null, line)
      })

      var server = createServer(':method :url :response-time', {
        immediate: true,
        stream: stream
      })

      request(server)
        .get('/')
        .expect(200, cb)
    })

    it('should not have value for :status', function (done) {
      var cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.equal(line, 'GET / -')
        done()
      })

      var stream = createLineStream(function (line) {
        cb(null, null, line)
      })

      var server = createServer(':method :url :status', {
        immediate: true,
        stream: stream
      })

      request(server)
        .get('/')
        .expect(200, cb)
    })

    it('should log before response', function (done) {
      var lineLogged = false
      var cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.equal(line, 'GET / -')
        done()
      })

      var stream = createLineStream(function (line) {
        lineLogged = true
        cb(null, null, line)
      })

      var server = createServer(':method :url :res[x-sent]', { immediate: true, stream: stream }, function () {
        assert.ok(lineLogged)
        this.body = this.ip
      })

      request(server)
        .get('/')
        .expect(200, cb)
    })
  })

  describe('with skip option', function () {
    it('should be able to skip based on request', function (done) {
      var stream = createLineStream(function () {
        throw new Error('should not log line')
      })

      function skip () {
        return this.req.url.indexOf('skip=true') !== -1
      }

      request(createServer('common', {skip: skip, stream: stream}))
        .get('/?skip=true')
        .set('Connection', 'close')
        .expect(200, done)
    })

    it('should be able to skip based on response', function (done) {
      var stream = createLineStream(function () {
        throw new Error('should not log line')
      })

      function skip () {
        return this.status === 200
      }

      request(createServer('common', {skip: skip, stream: stream}))
        .get('/')
        .expect(200, done)
    })
  })
})

function after (count, callback) {
  var i = 0
  var args = new Array(3)

  return function (err, res, line) {
    assert.ok(i++ < count, 'callback called ' + count + ' times')
    args[0] = args[0] || err
    args[1] = args[1] || res
    args[2] = args[2] || line

    if (count === i) callback.apply(null, args)
  }
}

function createLineStream (callback) {
  return split().on('data', callback)
}

function createServer (format, opts, mainFn) {
  var app = Toa(mainFn || function () {
    this.set('X-Sent', 'true')
    this.body = this.ip || '-'
  })

  app.use(morgan(format, opts))
  return app.listen()
}
