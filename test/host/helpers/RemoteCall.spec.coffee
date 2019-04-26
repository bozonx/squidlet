RemoteCall = require('../../../system/helpers/remoteCall/RemoteCall').default;


uniqId = 0


describe.only 'helpers.Republish', ->
  beforeEach ->
    @clientSend = (message) =>
      await @server.incomeMessage(message)
    @serverSend = (message) =>
      await @client.incomeMessage(message)
    @serverLocalMethods = {
      obj: {
        method1: sinon.stub().returns('result')
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
