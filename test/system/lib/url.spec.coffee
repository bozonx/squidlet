url = require('../../../system/lib/url')


describe.only 'system.lib.url', ->
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

  # TODO: наверное это не нужно
#  it 'parseLeftPartOfUrl - only host', ->
#    assert.deepEqual(url.parseLeftPartOfUrl('host.com'), {
#      host: 'host.com',
#    })

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
      search: {},
    })

  it 'parseRightPartOfUrl - anchor', ->
    assert.deepEqual(url.parseRightPartOfUrl('path#anc'), {
      path: 'path',
      search: {},
      anchor: 'anc',
    })

  it 'parseRightPartOfUrl - anchor with slash', ->
    assert.deepEqual(url.parseRightPartOfUrl('path/#anc'), {
      path: 'path/',
      search: {},
      anchor: 'anc',
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
      search: {}
    })

  it 'parseUrl - trailing ?', ->
    testUrl = 'http://host.com/path?'
    assert.deepEqual(url.parseUrl(testUrl), {
      scheme: 'http',
      host: 'host.com',
      path: '/path',
      search: {}
    })

  it 'parseUrl - url path', ->
    testUrl = '/path/to/route/?param1=value1'
    assert.deepEqual(url.parseUrl(testUrl), {
      path: '/path/to/route/',
      search: {
        param1: 'value1',
      },
    })

  it 'parseUrl - url path - no params', ->
    testUrl = 'path/to/route'
    assert.deepEqual(url.parseUrl(testUrl), {
      path: 'path/to/route',
      search: {},
    })

  it 'parseUrl - anchor', ->
    testUrl = 'path#anc'
    assert.deepEqual(url.parseUrl(testUrl), {
      path: 'path',
      search: {},
      anchor: 'anc',
    })

  it 'parseUrl - only host', ->
    testUrl = 'something'
    assert.deepEqual(url.parseUrl(testUrl), {
      host: 'something',
    })

  it 'parseUrl - bad url', ->
    assert.throws(() => url.parseUrl('http:/host.com/path'))
    # TODO: had to throw an exeption
    #assert.throws(() => url.parseUrl('http://host.com/path&p'))

# TODO: - no protocol and with host
