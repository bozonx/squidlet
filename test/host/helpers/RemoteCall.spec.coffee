RemoteCall = require('../../../system/helpers/remoteCall/RemoteCall').default;


uniqId = 0


describe.only 'helpers.Republish', ->
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
    @logError = sinon.spy()
    @generateUniqId = () =>
      uniqId++
      return String(uniqId)

    @client = new RemoteCall(@clientSend, {}, 1, @logError, @generateUniqId)
    @server = new RemoteCall(@serverSend, @serverLocalMethods, 1, @logError, @generateUniqId)

  it "call method on server", ->
    result = await @client.callMethod('obj', 'method1', 'param1', 5);

    assert.equal(result, 'result')
    sinon.assert.calledOnce(@serverLocalMethods.obj.method1)
    sinon.assert.calledWith(@serverLocalMethods.obj.method1, 'param1', 5)

  it "call method on server and server call cb", ->
    realCb = sinon.stub().returns('cbResult')
    await @client.callMethod('obj', 'methodWithCb', 'param1', realCb);

    result = await @fakeCb('cbParam', 5)

    assert.equal(result, 'cbResult')
    sinon.assert.calledOnce(realCb)
    sinon.assert.calledWith(realCb, 'cbParam', 5)
