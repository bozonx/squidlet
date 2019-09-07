helper = require('../../../system/lib/route')


describe.only 'system.lib.route', ->
  it 'parseRouteString', ->
    url = '/path/to/action/myAction/sub-url/5/true'
    route = '/path/to/action/:actionName/sub-url/:param1/:param2'

    assert.deepEqual(helper.parseRouteString(url, route), {
      route,
      params: {
        actionName: 'myAction'
        param1: 5
        param2: true
      }
    })

    assert.deepEqual(helper.parseRouteString('/action', '/action'), {
      route: '/action',
      params: {}
    })

    assert.deepEqual(helper.parseRouteString('/', '/'), {
      route: '/',
      params: {}
    })
