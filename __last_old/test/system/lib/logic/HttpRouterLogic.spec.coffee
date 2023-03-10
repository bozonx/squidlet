HttpRouterLogic = require('../../../../system/lib/logic/HttpRouterLogic').default


describe 'system.lib.HttpRouterLogic', ->
  beforeEach ->
    @router = new HttpRouterLogic(() => )
    @pinnedProps = {param1: 1}
    @request = {
      method: 'get'
      headers: {'content-type': 'application/json'}
      url: 'http://host:8080/path/to/myAction/subpath/5#anchor'
    }
    @response = {
      body: {res: 1}
    }

  it 'addRoute', ->
    handler1 = sinon.spy()
    handler2 = sinon.spy()
    handler3 = sinon.spy()
    handler4 = sinon.spy()
    handler5 = sinon.spy()
    handler6 = sinon.stub().returns(Promise.resolve(@response))
    @router.addRoute('get', '/', handler1);
    @router.addRoute('get', '/path/to', handler2);
    @router.addRoute('get', '/path/to/:action/subpath', handler3);
    @router.addRoute('get', '/path/to/:action/subpath', handler4);
    @router.addRoute('post', '/path/to/:action/subpath/:param1', handler5, {other: 5});
    @router.addRoute('get', '/path/to/:action/subpath/:param1', handler6, @pinnedProps);

    result = await @router.incomeRequest(@request)

    route = {
      location: {
        anchor: 'anchor',
        host: 'host',
        path: '/path/to/myAction/subpath/5',
        port: 8080,
        scheme: 'http'
      },
      params: { action: 'myAction', param1: 5 },
      pinnedProps: { param1: 1 },
      route: '/path/to/:action/subpath/:param1',
      routeId: 'get|/path/to/:action/subpath/:param1'
    }

    assert.deepEqual(result, @response)
    sinon.assert.notCalled(handler1)
    sinon.assert.notCalled(handler2)
    sinon.assert.notCalled(handler3)
    sinon.assert.notCalled(handler4)
    sinon.assert.notCalled(handler5)
    sinon.assert.calledOnce(handler6)
    sinon.assert.calledWith(handler6, route, @request)

  it 'private resolveRoute', ->
    routeHandler = sinon.spy()

    @router.registeredRoutes = [
      {
        routeId: 'get|/myroute/:param'
        route: '/myroute/:param'
        method: 'get'
        routeHandler
      }
    ]

    assert.deepEqual(@router.resolveRoute('get', '/myroute/5'), {
      route: '/myroute/:param',
      params: { param: 5 }
    })

  it 'request with decoded chars', ->
    handler1 = sinon.stub().returns(Promise.resolve(@response))
    request = {
      method: 'get'
      headers: {'content-type': 'application/json'}
      url: 'http://host:8087/api/getState/0,bedroom.light1'
    }

    @router.addRoute('get', '/api/:apiMethodName/:args', handler1);

    result = await @router.incomeRequest(request)

    route = {
      location: { host: 'host', path: '/api/getState/0,bedroom.light1', port: 8087, scheme: 'http' },
      params: { apiMethodName: 'getState', args: '0,bedroom.light1' },
      route: '/api/:apiMethodName/:args',
      routeId: 'get|/api/:apiMethodName/:args'
    }

    assert.deepEqual(result, @response)
    sinon.assert.calledOnce(handler1)
    sinon.assert.calledWith(handler1, route, request)
