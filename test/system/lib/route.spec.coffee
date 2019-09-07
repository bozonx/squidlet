helper = require('../../../system/lib/route')


describe.only 'system.lib.route', ->
  beforeEach ->
    @url = '/path/to/action/myAction/sub-url/5/true'
    @route = '/path/to/action/:actionName/sub-url/:param1/:param2'

  it 'prepareRoute', ->
    assert.equal(helper.prepareRoute('/'), '/')
    assert.equal(helper.prepareRoute('route'), '/route')
    assert.equal(helper.prepareRoute('/route'), '/route')
    assert.equal(helper.prepareRoute('/route/to/'), '/route/to')

  it 'matchRoute', ->


  it 'filterRoutes', ->
    routes = [
      '/path/to/action',
      '/path/to/action/:actionName',
      '/path/to/action/:actionName/sub-url/:anotherParam/:param2',
      '/path/to/action/:actionName/sub-url/:param1',
      '/path/to/action/:actionName/sub-url/:param1/:param2',
      '/path/to/action/:actionName/sub-url/:param1/other/:param2',
    ]
    assert.deepEqual(helper.filterRoutes(@url, routes), [
      '/path/to/action/:actionName/sub-url/:anotherParam/:param2',
      @route
    ])

  it 'parseRouteParams', ->
    assert.deepEqual(helper.parseRouteParams(@url, @route), {
      actionName: 'myAction'
      param1: 5
      param2: true
    })
    assert.deepEqual(helper.parseRouteParams('/action', '/action'), {})
    assert.deepEqual(helper.parseRouteParams('/', '/'), {})
