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

  it 'parseUrl', ->
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
