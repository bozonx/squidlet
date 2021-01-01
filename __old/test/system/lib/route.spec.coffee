helper = require('../../../system/lib/route')


describe 'system.lib.route', ->
  beforeEach ->
    @url = '/path/to/action/myAction/sub-url/5/true'
    @route = '/path/to/action/:actionName/sub-url/:param1/:param2'
    @allRoutes = [
      '/path/to/action',
      '/path/to/action/:actionName',
      '/path/to/action/:actionName/sub-url/:param1/:param2',
      '/path/to/action/:actionName/sub-url/:param1',
      '/path/to/action/:actionName/sub-url/:anotherParam/:param2',
      '/path/to/action/:actionName/sub-url/:param1/other/:param2',
    ]
    @params = {
      actionName: 'myAction'
      param1: 5
      param2: true
    }

  it 'prepareRoute', ->
    assert.equal(helper.prepareRoute('/'), '/')
    assert.equal(helper.prepareRoute('route'), '/route')
    assert.equal(helper.prepareRoute('/route'), '/route')
    assert.equal(helper.prepareRoute('/route/to/'), '/route/to')

  it 'matchRoute', ->
    assert.isUndefined(helper.matchRoute('/path/to/otherAction/myAction/sub-url/5/true', @allRoutes))
    assert.deepEqual(helper.matchRoute('/', ['/action', '/']), {
      route: '/',
      params: {},
    })
    assert.deepEqual(helper.matchRoute(@url, @allRoutes), {
      route: @route,
      params: @params,
    })

  it 'filterRoutes', ->
    assert.deepEqual(helper.filterRoutes(@url, @allRoutes), [
      @route,
      '/path/to/action/:actionName/sub-url/:anotherParam/:param2',
    ])

  it 'parseRouteParams', ->
    assert.deepEqual(helper.parseRouteParams(@url, @route), @params)
    assert.deepEqual(helper.parseRouteParams('/action', '/action'), {})
    assert.deepEqual(helper.parseRouteParams('/', '/'), {})
    assert.deepEqual(helper.parseRouteParams(
      '/api/getState/0,bedroom.light1',
      '/api/:apiMethodName/:args'
    ), { apiMethodName: 'getState', args: '0,bedroom.light1' })
