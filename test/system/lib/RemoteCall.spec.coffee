RemoteCall = require('../../../system/lib/remoteCall/RemoteCall').default;


uniqId = 0


describe 'system.lib.RemoteCall', ->
  beforeEach ->
    @fakeCb = undefined
    @clientSend = (message) =>
      await @server.incomeMessage(message)
    @serverSend = (message) =>
      await @client.incomeMessage(message)
    @serverLocalMethods = {
      obj: {
        method1: sinon.stub().returns('result')
        methodWithCb: (param, fakeCb) =>
          @fakeCb = fakeCb
          return 'result'
      }
    }
    @methodAccesser = (pathToMethod, args...) =>
      _.get(@serverLocalMethods, pathToMethod)(args...)

    @logError = sinon.spy()
    @generateUniqId = () =>
      uniqId++
      return String(uniqId)

    @client = new RemoteCall(@clientSend, undefined, 1, @logError, @generateUniqId)
    @server = new RemoteCall(@serverSend, @methodAccesser, 1, @logError, @generateUniqId)

  it "call method on server", ->
    result = await @client.callMethod('obj.method1', 'param1', 5);

    assert.equal(result, 'result')
    sinon.assert.calledOnce(@serverLocalMethods.obj.method1)
    sinon.assert.calledWith(@serverLocalMethods.obj.method1, 'param1', 5)

  it "call method on server and server call cb", ->
    realCb = sinon.stub().returns('cbResult')
    await @client.callMethod('obj.methodWithCb', 'param1', realCb);

    result = await @fakeCb('cbParam', 5)

    assert.equal(result, 'cbResult')
    sinon.assert.calledOnce(realCb)
    sinon.assert.calledWith(realCb, 'cbParam', 5)
