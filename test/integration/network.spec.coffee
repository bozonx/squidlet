Network = require('../../src/network/Network').default

describe.skip 'integration network', ->
  beforeEach ->
    @drivers = {
      # TODO: !!!!
    }
    @fromHost = 'master'
    @toHost = 'bedroom/host'
    @config = {
      # TODO: !!!!
    }

    @payload = {
      to: @toHost
      payload: { myData: 1 }
    }

    @networkSrc = new Network(@drivers, @fromHost, @config)
    @networkDst = new Network(@drivers, @fromHost, @config)
    @networkSrc.init()
    @networkDst.init()

  it 'send', ->
    handler = sinon.spy()
    @networkDst.listenIncome(handler)
    @networkSrc.send(@toHost, @payload)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, @payload)
    # TODO: на другом конце network.listenIncome - мы должны получить отправленные данные
