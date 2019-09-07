helper = require('../../../system/lib/route')


describe.only 'system.lib.route', ->
  it 'parseRouteParams', ->
    url = '/path/to/action/myAction/sub-url/5/true'
    route = '/path/to/action/:actionName/sub-url/:param1/:param2'

    assert.deepEqual(helper.parseRouteParams(url, route), {
      actionName: 'myAction'
      param1: 5
      param2: true
    })
    assert.deepEqual(helper.parseRouteParams('/action', '/action'), {})
    assert.deepEqual(helper.parseRouteParams('/', '/'), {})
