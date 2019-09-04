url = require('../../../system/lib/url')


describe.only 'system.lib.url', ->
  it 'parseSearch', ->
    assert.deepEqual(url.parseSearch('param1=value1&param2&param3=5&param4=true'), {
      param1: 'value1',
      param2: undefined,
      param3: 5,
      param4: true,
    })
    assert.deepEqual(url.parseSearch('param1=[1, true, "str"]'), {
      param1: [1, true, 'str']
    })
    # TODO: test lists
  it 'parseHostPort', ->
    assert.deepEqual(url.parseHostPort('pre.host.com:8080'), {
      host: 'pre.host.com',
      port: 8080,
    })
    # TODO: test other cases

  it 'parseUserPassword', ->
    assert.deepEqual(url.parseUserPassword('username:password'), {
      user: 'username',
      password: 'password',
    })
    # TODO: test other cases

  it 'parseUrl', ->
    testUrl = 'https://username:password@host.com:8080/path/to/route/?param1=value1&param2'
    assert.deepEqual(url.parseUrl(testUrl), {
      protocol: 'https',
      host: 'host.com',
      port: 8080,
      url: '/path/to/route/',
      search: {
        param1: 'value1',
        param2: undefined,
      },
      user: 'username',
      password: 'password',
    })
