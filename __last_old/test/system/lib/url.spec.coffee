url = require('../../../system/lib/url')


describe 'system.lib.url', ->
  it 'parseSearch', ->
    assert.deepEqual(url.parseSearch('param1=value1&param2&param3=5&param4=true'), {
      param1: 'value1',
      param2: '',
      param3: 5,
      param4: true,
    })
    assert.deepEqual(url.parseSearch('param1=[1, true, "str"]'), {
      param1: [1, true, 'str']
    })
    assert.deepEqual(url.parseSearch('param1={"a": "str", "b": 5, "c": true}'), {
      param1: {a: "str", b: 5, c: true}
    })

  it 'parseHostPort', ->
    assert.deepEqual(url.parseHostPort('pre.host.com:8080'), {
      host: 'pre.host.com',
      port: 8080,
    })
    assert.deepEqual(url.parseHostPort('pre.host.com'), {
      host: 'pre.host.com',
    })
    assert.throws(() => url.parseHostPort(''))
    assert.throws(() => url.parseHostPort('host:port'))
    assert.throws(() => url.parseHostPort('host:80:90'))

  it 'parseUserPassword', ->
    assert.deepEqual(url.parseUserPassword('username:password'), {
      user: 'username',
      password: 'password',
    })
    assert.deepEqual(url.parseUserPassword('username'), {
      user: 'username',
    })
    assert.deepEqual(url.parseUserPassword(''), {})
    assert.throws(() => url.parseHostPort('username:password:other'))

  it 'parseLeftPartOfUrl - full url', ->
    assert.deepEqual(url.parseLeftPartOfUrl('https://username:password@host.com:8080/path'), {
      scheme: 'https',
      host: 'host.com',
      port: 8080,
      user: 'username',
      password: 'password',
    })

  it 'parseLeftPartOfUrl - username and not password', ->
    assert.deepEqual(url.parseLeftPartOfUrl('https://username@host.com'), {
      scheme: 'https',
      host: 'host.com',
      user: 'username',
    })

  it 'parseLeftPartOfUrl - only protocol and host', ->
    assert.deepEqual(url.parseLeftPartOfUrl('https://host.com'), {
      scheme: 'https',
      host: 'host.com',
    })

  it 'parseLeftPartOfUrl - ip', ->
    assert.deepEqual(url.parseLeftPartOfUrl('https://192.168.0.1:80'), {
      scheme: 'https',
      host: '192.168.0.1',
      port: 80,
    })

  it 'parseLeftPartOfUrl - ip only', ->
    assert.deepEqual(url.parseLeftPartOfUrl('192.168.0.1'), {
      host: '192.168.0.1',
    })

  it 'parseLeftPartOfUrl - only host', ->
    assert.deepEqual(url.parseLeftPartOfUrl('host.com'), {
      host: 'host.com',
    })

  it 'parseLeftPartOfUrl - local host', ->
    assert.deepEqual(url.parseLeftPartOfUrl('localhost'), {
      host: 'localhost',
    })

  it 'parseRightPartOfUrl - full', ->
    assert.deepEqual(url.parseRightPartOfUrl('/path/to/route/?param1=value1&param2#anc'), {
      path: '/path/to/route/',
      search: {
        param1: 'value1',
        param2: '',
      },
      anchor: 'anc',
    })

  it 'parseRightPartOfUrl - stripped', ->
    assert.deepEqual(url.parseRightPartOfUrl('path/to/route/?'), {
      path: 'path/to/route/',
    })

  it 'parseRightPartOfUrl - anchor', ->
    assert.deepEqual(url.parseRightPartOfUrl('path#anc'), {
      path: 'path',
      anchor: 'anc',
    })

  it 'parseRightPartOfUrl - anchor with slash', ->
    assert.deepEqual(url.parseRightPartOfUrl('path/#anc'), {
      path: 'path/',
      anchor: 'anc',
    })

  it 'splitUrl - full', ->
    assert.deepEqual(url.splitUrl('https://u:p@host.com:80/path?p1=v1#a'), {
      left: 'https://u:p@host.com:80',
      right: '/path?p1=v1#a'
    })

  it 'splitUrl - short', ->
    assert.deepEqual(url.splitUrl('host.com/path/'), {
      left: 'host.com',
      right: '/path/'
    })

  it 'splitUrl - only left', ->
    assert.deepEqual(url.splitUrl('http://host.com'), {
      left: 'http://host.com'
    })

  it 'splitUrl - only left - only host', ->
    assert.deepEqual(url.splitUrl('host.com'), {
      left: 'host.com'
    })

  it 'splitUrl - only left - local host', ->
    assert.deepEqual(url.splitUrl('localhost'), {
      left: 'localhost'
    })

  it 'splitUrl - only left - ip', ->
    assert.deepEqual(url.splitUrl('192.168.0.1'), {
      left: '192.168.0.1'
    })

  it 'splitUrl - only right', ->
    assert.deepEqual(url.splitUrl('/path'), {
      right: '/path'
    })

  it 'splitUrl - only right - anchor', ->
    assert.deepEqual(url.splitUrl('/#anc'), {
      right: '/#anc'
    })

  it 'splitUrl - only right - anchor at the beginning', ->
    assert.deepEqual(url.splitUrl('#anc'), {
      right: '#anc'
    })


  it 'parseUrl - full', ->
    testUrl = 'https://username:password@host.com:8080/path/to/route/?param1=value1&param2'
    assert.deepEqual(url.parseUrl(testUrl), {
      scheme: 'https',
      host: 'host.com',
      port: 8080,
      path: '/path/to/route/',
      search: {
        param1: 'value1',
        param2: '',
      },
      user: 'username',
      password: 'password',
    })

  it 'parseUrl - simplified', ->
    testUrl = 'http://host.com/'
    assert.deepEqual(url.parseUrl(testUrl), {
      scheme: 'http',
      host: 'host.com',
      path: '/',
    })

  it 'parseUrl - simplified, no path', ->
    testUrl = 'http://host.com'
    assert.deepEqual(url.parseUrl(testUrl), {
      scheme: 'http',
      host: 'host.com',
    })

  it 'parseUrl - trailing ?', ->
    testUrl = 'http://host.com/path?'
    assert.deepEqual(url.parseUrl(testUrl), {
      scheme: 'http',
      host: 'host.com',
      path: '/path',
    })

  it 'parseUrl - url path', ->
    testUrl = '/path/to/route/?param1=value1'
    assert.deepEqual(url.parseUrl(testUrl), {
      path: '/path/to/route/',
      search: {
        param1: 'value1',
      },
    })

  it 'parseUrl - only host', ->
    testUrl = 'something'
    assert.deepEqual(url.parseUrl(testUrl), {
      host: 'something',
    })

  it 'parseUrl - localhost', ->
    testUrl = 'localhost/to/route'
    assert.deepEqual(url.parseUrl(testUrl), {
      host: 'localhost'
      path: '/to/route',
    })

  it 'parseUrl - anchor', ->
    testUrl = 'path#anc'
    assert.deepEqual(url.parseUrl(testUrl), {
      host: 'path',
      anchor: 'anc',
    })

  it 'parseUrl - no protocol', ->
    testUrl = 'host.com/path'
    assert.deepEqual(url.parseUrl(testUrl), {
      host: 'host.com',
      path: '/path',
    })

  it 'parseUrl - ip', ->
    testUrl = '192.168.0.1/path'
    assert.deepEqual(url.parseUrl(testUrl), {
      host: '192.168.0.1',
      path: '/path',
    })

  it 'parseUrl - decoded values in a path', ->
    testUrl = '127.0.0.1:8087/api/getState/0,bedroom.light1'
    assert.deepEqual(url.parseUrl(testUrl), {
      host: '127.0.0.1',
      port: 8087,
      path: '/api/getState/0,bedroom.light1',
    })

  it 'parseUrl - dot in file name', ->
    testUrl = '127.0.0.1/path/index.html?param=1'
    assert.deepEqual(url.parseUrl(testUrl), {
      host: '127.0.0.1',
      path: '/path/index.html',
      search: {
        param: 1
      }
    })

  it 'parseUrl - encoded by encodeURIComponent', ->
    testUrl = 'http://192.168.88.3:8087/api/getState/0%2C%22bedroom.light1%22'
    assert.deepEqual(url.parseUrl(testUrl), {
      host: '192.168.88.3',
      port: 8087,
      path: '/api/getState/0,"bedroom.light1"',
      scheme: 'http',
    })


#it 'parseUrl - bad url', ->
    # bad protocol
    #assert.throws(() => url.parseUrl('http:/host.com/path'))
    # bad search
    #assert.throws(() => url.parseUrl('http://host.com/path&p'))
    # bad host
    #assert.throws(() => url.parseUrl('http://:80/path&p'))
