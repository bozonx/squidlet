url = require('../../../system/lib/url')


describe 'system.lib.url', ->
  it 'parseUrl', ->
    testUrl = 'https://username:password@pre.host.com:8080/path/to/route/?param1=value1&param2&param3=5&param4=true'
    assert.deepEqual(url.parseUrl(testUrl), {
      protocol: 'https',
      host: 'pre.host.com',
      port: 8080,
      url: '/path/to/route/',
      search: {
        param1: 'value1',
        param2: undefined,
        param3: 5,
        param4: true,
      },
      user: 'username',
      password: 'password',
    })
