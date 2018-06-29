Network = require('../../src/network/Network').default
Drivers = require('../../src/app/Drivers').default
{ Map } = require('immutable');


describe.only 'integration network', ->
  beforeEach ->
    driversPaths = new Map({
      # TODO: !!!!
    })
    @drivers = new Drivers()
    @srcHost = 'master'
    @dstHost = 'remote'
    @config = {
      routes: {
        [@dstHost]: [ @srcHost ]
      }
      params: {
        routedMessageTTL: 10
      }
      # TODO: !!!!
    }

    @payload = {
      to: @dstHost
      payload: { myData: 1 }
    }

    @networkSrc = new Network(@drivers, @srcHost, @config)
    @networkDst = new Network(@drivers, @dstHost, @config)

    @drivers.init(driversPaths, {})
    @networkSrc.init()
    @networkDst.init()

  it 'send', ->
    handler = sinon.spy()
    @networkDst.listenIncome(handler)
    @networkSrc.send(@toHost, @payload)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, null, @payload)
    # TODO: на другом конце network.listenIncome - мы должны получить отправленные данные
