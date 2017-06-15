'use strict'
// **Github:** https://github.com/toajs/toa-morgan
//
// modified from https://github.com/expressjs/morgan/blob/master/test/morgan.js
// **License:** MIT

const Toa = require('toa')
const tman = require('tman')
const split = require('split')
const assert = require('assert')
const request = require('supertest')
const morgan = require('..')

tman.suite('toa-morgan', function () {
  tman.suite('arguments', function () {
    tman.it('should use default format', function (done) {
      let cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.strictEqual(res.text.length > 0, true)
        assert.strictEqual(line.substr(0, res.text.length), res.text)
        done()
      })

      let stream = createLineStream(function (line) {
        cb(null, null, line)
      })

      request(createServer(undefined, {stream: stream}))
        .get('/')
        .expect(200, cb)
    })

    tman.suite('format', function () {
      tman.it('should accept format as format name', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert(/^GET \/ 200 \d+ - \d+ ms$/.test(line))
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('tiny', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should accept format as format string', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'GET /')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':method :url', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should accept format as function', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'GET / 200')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        function format () {
          return [this.method, this.url, this.status].join(' ')
        }

        request(createServer(format, {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should reject format as bool', function () {
        assert.throws(createServer.bind(null, true), /argument format/)
      })
    })
  })

  tman.suite('tokens', function () {
    tman.suite(':date', function () {
      tman.it('should get current date in "web" format by default', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(line))
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should get current date in "clf" format', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} \+0000$/.test(line))
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date[clf]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should get current date in "iso" format', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(line))
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date[iso]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should get current date in "web" format', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(line))
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date[web]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should be blank for unknown format', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '-')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':date[bogus]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    tman.suite(':http-version', function () {
      tman.it('should be 1.0 or 1.1', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(/^1\.[01]$/.test(line))
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':http-version', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    tman.suite(':req', function () {
      tman.it('should get request properties', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'me')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':req[x-from-string]', {stream: stream}))
          .get('/')
          .set('x-from-string', 'me')
          .expect(200, cb)
      })

      tman.it('should display all values of array headers', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'foo=bar, fizz=buzz')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':req[set-cookie]', {stream: stream}))
          .get('/')
          .set('Set-Cookie', ['foo=bar', 'fizz=buzz'])
          .expect(200, cb)
      })
    })

    tman.suite(':res', function () {
      tman.it('should get response properties', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'true')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':res[x-sent]', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should display all values of array headers', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'foo, bar')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer(':res[x-keys]', {stream: stream}, function () {
          this.set('X-Keys', ['foo', 'bar'])
          this.body = this.ip
        })

        request(server)
          .get('/')
          .expect('X-Keys', 'foo, bar')
          .expect(200, cb)
      })
    })

    tman.suite(':remote-addr', function () {
      tman.it('should get remote address', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(res.text.length > 0)
          assert.equal(line, res.text)
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':remote-addr', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should work when connection: close', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(res.text.length > 0)
          assert.equal(line, res.text)
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':remote-addr', {stream: stream}))
          .get('/')
          .set('Connection', 'close')
          .expect(200, cb)
      })

      tman.it('should work when connection: keep-alive', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(res.text.length > 0)
          assert.equal(line, res.text)

          res.req.connection.destroy()
          server.close(done)
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer(':remote-addr', {stream: stream}, function () {
          this.body = this.ip
          delete this.req._remoteAddress
        })

        request(server.listen())
          .get('/')
          .set('Connection', 'keep-alive')
          .expect(200, cb)
      })

      tman.it('should not fail if req.connection missing', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.ok(res.text.length > 0)
          assert.equal(line, res.text)

          res.req.connection.destroy()
          server.close(done)
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer(':remote-addr', {stream: stream}, null, function () {
          this.body = this.ip
          delete this.req.connection
        })

        request(server.listen())
          .get('/')
          .set('Connection', 'keep-alive')
          .expect(200, cb)
      })
    })

    tman.suite(':remote-user', function () {
      tman.it('should be empty if none present', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '-')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':remote-user', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    tman.suite(':response-time', function () {
      tman.it('should be in milliseconds', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let end = Date.now()
          let ms = parseFloat(line) || 0
          assert(ms >= 0)
          assert(ms < end - start + 1)
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let start = Date.now()

        request(createServer(':response-time', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should not include response latency', function (done) {
        let end
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let ms = parseFloat(line)
          assert.ok(ms >= 0, 'positive milliseconds')
          assert.ok(ms < end - start + 10, 'response time expected to be < ' + (end - start + 10) + ', but was ' + ms)
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer(':response-time', {stream: stream}, function () {
          let res = this.res
          this.status = 200
          this.respond = false
          res.write('hello, ')
          end = Date.now()

          setTimeout(function () {
            res.end('world!')
          }, 50)
        })

        let start = Date.now()

        request(server)
          .get('/')
          .expect(200, cb)
      })

      tman.it('should be empty before response', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '-')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer(':response-time', {
          immediate: true,
          stream: stream
        })

        request(server)
          .get('/')
          .expect(200, cb)
      })
    })

    tman.suite(':status', function () {
      tman.it('should get response status', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, String(res.statusCode))
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':status', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should not exist before response sent', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '-')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer(':status', {
          immediate: true,
          stream: stream
        })

        request(server)
          .get('/')
          .expect(200, cb)
      })

      tman.it('should not exist for aborted request', function (done) {
        let stream = createLineStream(function (line) {
          assert.equal(line, '-')
          server.close(done)
        })

        let server = createServer(':status', {stream: stream}, function () {
          return function (next) {
            test.abort()
          }
        })

        let test = request(server).post('/')
        test.write('0')
      })
    })

    tman.suite(':url', function () {
      tman.it('should get request URL', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '/foo')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer(':url', {stream: stream}))
          .get('/foo')
          .expect(200, cb)
      })

      tman.it('should use this.originalUrl if exists', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, '/bar')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer(':url', {stream: stream}, function () {
          this.body = this.ip
          this.originalUrl = '/bar'
        })

        request(server)
          .get('/')
          .expect(200, cb)
      })

      tman.it('should not exist for aborted request', function (done) {
        let stream = createLineStream(function (line) {
          assert.equal(line, '-')
          server.close(done)
        })

        let server = createServer(':status', {stream: stream}, function () {
          return function (next) {
            test.abort()
          }
        })

        let test = request(server).post('/')
        test.write('0')
      })
    })
  })

  tman.suite('formats', function () {
    tman.suite('a function', function () {
      tman.it('should log result of function', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          assert.equal(line, 'GET / 200')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        function format () {
          return [this.method, this.req.url, this.res.statusCode].join(' ')
        }

        request(createServer(format, {stream: stream}))
          .get('/')
          .expect(200, cb)
      })

      tman.it('should not log for undefined return', function (done) {
        let stream = createLineStream(function () {
          throw new Error('should not log line')
        })

        function format (tokens, req, res) {
          return undefined
        }

        request(createServer(format, {stream: stream}))
          .get('/')
          .expect(200, done)
      })

      tman.it('should not log for null return', function (done) {
        let stream = createLineStream(function () {
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

    tman.suite('combined', function () {
      tman.it('should match expectations', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let masked = line
            .replace(/\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} \+0000/, '_timestamp_')
            .replace(/200 \d+/, '200 -')
          assert.equal(masked, res.text + ' - - [_timestamp_] "GET / HTTP/1.1" 200 - "http://localhost/" "my-ua"')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('combined', {stream: stream}))
          .get('/')
          .set('Referer', 'http://localhost/')
          .set('User-Agent', 'my-ua')
          .expect(200, cb)
      })
    })

    tman.suite('common', function () {
      tman.it('should match expectations', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let masked = line
            .replace(/\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2} \+0000/, '_timestamp_')
            .replace(/200 \d+/, '200 -')
          assert.equal(masked, res.text + ' - - [_timestamp_] "GET / HTTP/1.1" 200 -')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('common', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    tman.suite('dev', function () {
      tman.it('should not color 1xx', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_') // eslint-disable-line
          assert.equal(masked.substr(0, 37), '_color_0_GET / _color_0_102 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer('dev', {stream: stream}, function () {
          this.status = 102
        })

        request(server)
          .get('/')
          .expect(102, cb)
      })

      tman.it('should color 2xx green', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_') // eslint-disable-line
          assert.equal(masked.substr(0, 38), '_color_0_GET / _color_32_200 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer('dev', {stream: stream}, function () {
          this.status = 200
          this.body = this.ip
        })

        request(server)
          .get('/')
          .expect(200, cb)
      })

      tman.it('should color 3xx cyan', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_') // eslint-disable-line
          assert.equal(masked.substr(0, 38), '_color_0_GET / _color_36_300 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer('dev', {stream: stream}, function () {
          this.status = 300
        })

        request(server)
          .get('/')
          .expect(300, cb)
      })

      tman.it('should color 4xx yelow', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_') // eslint-disable-line
          assert.equal(masked.substr(0, 38), '_color_0_GET / _color_33_400 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer('dev', {stream: stream}, function () {
          this.status = 400
        })

        request(server)
          .get('/')
          .expect(400, cb)
      })

      tman.it('should color 5xx red', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let masked = line.replace(/\x1b\[(\d+)m/g, '_color_$1_') // eslint-disable-line
          assert.equal(masked.substr(0, 38), '_color_0_GET / _color_31_500 _color_0_')
          assert.equal(masked.substr(-9), '_color_0_')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        let server = createServer('dev', {stream: stream}, function () {
          this.status = 500
        })

        request(server)
          .get('/')
          .expect(500, cb)
      })
    })

    tman.suite('short', function () {
      tman.it('should match expectations', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let masked = line.replace(/\d+ ms/, '- ms').replace(/200 \d+/, '200 -')
          assert.equal(masked, res.text + ' - GET / HTTP/1.1 200 - - - ms')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('short', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })

    tman.suite('tiny', function () {
      tman.it('should match expectations', function (done) {
        let cb = after(2, function (err, res, line) {
          if (err) return done(err)
          let masked = line.replace(/200 \d+/, '200 -').replace(/\d+ ms/, '- ms')
          assert.equal(masked, 'GET / 200 - - - ms')
          done()
        })

        let stream = createLineStream(function (line) {
          cb(null, null, line)
        })

        request(createServer('tiny', {stream: stream}))
          .get('/')
          .expect(200, cb)
      })
    })
  })

  tman.suite('with immediate option', function () {
    tman.it('should not have value for :res', function (done) {
      let cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.equal(line, 'GET / -')
        done()
      })

      let stream = createLineStream(function (line) {
        cb(null, null, line)
      })

      let server = createServer(':method :url :res[x-sent]', {
        immediate: true,
        stream: stream
      })

      request(server)
        .get('/')
        .expect(200, cb)
    })

    tman.it('should not have value for :response-time', function (done) {
      let cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.equal(line, 'GET / -')
        done()
      })

      let stream = createLineStream(function (line) {
        cb(null, null, line)
      })

      let server = createServer(':method :url :response-time', {
        immediate: true,
        stream: stream
      })

      request(server)
        .get('/')
        .expect(200, cb)
    })

    tman.it('should not have value for :status', function (done) {
      let cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.equal(line, 'GET / -')
        done()
      })

      let stream = createLineStream(function (line) {
        cb(null, null, line)
      })

      let server = createServer(':method :url :status', {
        immediate: true,
        stream: stream
      })

      request(server)
        .get('/')
        .expect(200, cb)
    })

    tman.it('should log before response', function (done) {
      let lineLogged = false
      let cb = after(2, function (err, res, line) {
        if (err) return done(err)
        assert.equal(line, 'GET / -')
        done()
      })

      let stream = createLineStream(function (line) {
        lineLogged = true
        cb(null, null, line)
      })

      let server = createServer(':method :url :res[x-sent]', { immediate: true, stream: stream }, function () {
        assert.ok(lineLogged)
        this.body = this.ip
      })

      request(server)
        .get('/')
        .expect(200, cb)
    })
  })

  tman.suite('with skip option', function () {
    tman.it('should be able to skip based on request', function (done) {
      let stream = createLineStream(function () {
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

    tman.it('should be able to skip based on response', function (done) {
      let stream = createLineStream(function () {
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
  let i = 0
  let args = new Array(3)

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
  let app = new Toa()
  app.use(morgan(format, opts))
  app.use(mainFn || function () {
    this.set('X-Sent', 'true')
    this.body = this.ip || '-'
  })

  return app.listen()
}
