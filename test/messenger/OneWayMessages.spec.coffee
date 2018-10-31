OneWayMessages = require('../../host/src/messenger/OneWayMessages').default


describe.only 'messenger.OneWayMessages', ->
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

    @oneWay = new OneWayMessages(@system, @messenger)

  it 'request', ->
