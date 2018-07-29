RequestResponse = require('../../src/messenger/RequestResponse').default


describe.only 'messenger.RequestResponse', ->
  beforeEach ->
    @toHost = 'remoteHost'
    @topic = 'topic'
    @payload = 'req payload'
#    @incomeHandler = null
    @system = {
      host: {
        id: 'master'
        networkConfig: {
          params: {
            requestTimeout: 0
          }
        }
      }
      io: {
        generateUniqId: -> '123'
      }
#      network: {
#        hostId: 'master'
#        send: sinon.stub().returns(Promise.resolve())
#      }
#      events: {
#        addListener: (category, topic, handler) => @incomeHandler = handler
#      }
    }
    @messenger = {
      $sendMessage: () => Promise.resolve()
    }
    @response = {
      payload: 'resp payload'
      requestId: '123'
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
