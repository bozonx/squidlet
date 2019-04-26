RemoteCall = require('../../../system/helpers/remoteCall/RemoteCall').default;


uniqId = 0


describe.only 'helpers.Republish', ->
  beforeEach ->
    @remoteCb = undefined
    @clientSend = (message) =>
      await @server.incomeMessage(message)
    @serverSend = (message) =>
      await @client.incomeMessage(message)
    @serverLocalMethods = {
      obj: {
        method1: sinon.stub().returns('result')
        methodWithCb: (param, cb) => @cb = @remoteCb
      }
    }
    @clientSenderId = 'client';
    @serverSenderId = 'master';
    @logError = sinon.spy()
    @generateUniqId = () =>
      uniqId++
      return String(uniqId)

    @client = new RemoteCall(@clientSend, {}, @clientSenderId, 1, @logError, @generateUniqId)
    @server = new RemoteCall(@serverSend, @serverLocalMethods, @serverSenderId, 1, @logError, @generateUniqId)

  it "call method on server", ->
    result = await @client.callMethod('obj', 'method1', 'param1', 5);

    assert.equal(result, 'result')
    sinon.assert.calledOnce(@serverLocalMethods.obj.method1)
    sinon.assert.calledWith(@serverLocalMethods.obj.method1, 'param1', 5)

  it "call method on server and server call cb", ->
    cb = sinon.spy()
    await @client.callMethod('obj', 'methodWithCb', 'param1', cb);

    await @cb('cbParam', 5)

    sinon.assert.calledOnce(cb)
    sinon.assert.calledWith(cb, 'cbParam', 5)
