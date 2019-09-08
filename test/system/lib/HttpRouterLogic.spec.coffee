HttpRouterLogic = require('../../../system/lib/HttpRouterLogic').default


describe 'system.lib.HttpRouterLogic', ->
  beforeEach ->
    @router = new HttpRouterLogic(() => )
    @pinnedProps = {param1: 1}
    @request = {
      method: 'get'
      headers: {'content-type': 'application/json'}
      url: '/path/to/myAction/subpath/5'
    }
    @response = {
      #headers: {'content-type': 'application/json'}
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
      # TODO: add
    }

    assert.deepEqual(result, @response)
#    sinon.assert.notCalled(handler1)
#    sinon.assert.notCalled(handler2)
#    sinon.assert.notCalled(handler3)
#    sinon.assert.notCalled(handler4)
#    sinon.assert.notCalled(handler5)
#    sinon.assert.calledOnce(handler6)
#    sinon.assert.calledWith(handler6, route, @request)
