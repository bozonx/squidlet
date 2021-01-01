RequestResponse = require('../../plugin-bridge/messenger/RequestResponse').default


describe 'messenger.RequestResponse', ->
  beforeEach ->
    @toHost = 'remoteHost'
    @topic = 'topic'
    @payload = 'req payload'
    @incomeHandler = null
    @requestId = '123'
    @system = {
      host: {
        id: 'master'
        networkConfig: {
          params: {
            requestTimeout: 0
          }
        }
        generateUniqId: => @requestId
      }
      events: {
        addListener: sinon.spy()
        addCategoryListener: (category, handler) => @incomeHandler = handler
        removeListener: sinon.spy()
        removeCategoryListener: sinon.spy()
      }
    }
    @messenger = {
      $sendMessage: sinon.stub().returns(Promise.resolve())
    }
    @response = {
      payload: 'resp payload'
      requestId: @requestId
      isResponse: true
    }

    @requestResponse = new RequestResponse(@system, @messenger)

  it 'request', ->
    respHandler = undefined
    @requestResponse.startWaitForResponse = (requestId, handler) => respHandler = handler

    responsePromise = @requestResponse.request(@toHost, @topic, @payload)
    respHandler(null, @response)

    response = await responsePromise

    assert.deepEqual(response, @response)

  it 'response', ->
    request = {
      topic: @topic
      from: @toHost
      requestId: @requestId
    }

    await @requestResponse.response(request, undefined, undefined, @payload)

    sinon.assert.calledWith(@messenger.$sendMessage, {
      category: 'messengerRequestResponse'
      code: undefined
      error: undefined
      from: 'master'
      isResponse: true
      payload: 'req payload'
      requestId: @requestId
      to: 'remoteHost'
      topic: 'topic'
    })

  it 'startWaitForResponse', ->
    handler = sinon.spy()
    @requestResponse.startWaitForResponse(@requestId, handler)

    @incomeHandler(@response)

    sinon.assert.calledWith(handler, null, @response)
    sinon.assert.calledWith(@system.events.removeListener, 'request-response', undefined)

  it 'start and stop wait for response', ->
    handler = sinon.spy()
    @requestResponse.startWaitForResponse(@requestId, handler)

    assert.isOk(@requestResponse.timeouts[@requestId])
    assert.isOk(@requestResponse.handlers[@requestId])

    @requestResponse.stopWaitForResponse(@requestId)

    assert.isNotOk(@requestResponse.timeouts[@requestId])
    assert.isNotOk(@requestResponse.handlers[@requestId])
    sinon.assert.calledWith(@system.events.removeListener, 'request-response', undefined)
