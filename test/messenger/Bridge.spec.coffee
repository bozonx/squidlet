Bridge = require('../../src/messenger/Bridge').default


describe.only 'app.Router', ->
  beforeEach ->
    @toHost = 'remoteHost'
    @category = 'cat'
    @topic = 'topic'
    @app = {
      system: {
        io: {
          generateUniqId: -> '123'
        }
      }
      network: {
        send: sinon.stub().returns(Promise.resolve())
      }
#      host: {
#        id: 'currentHost'
#        config: {
#          host: {
#            routedMessageTTL: 100
#          }
#          routes: {
#            'destHost': [ 'currentHost', 'nextHost', 'destHost' ]
#          }
#          neighbors: {
#            nextHost: {
#              type: 'i2c'
#              bus: '1'
#              address: '5a'
#            }
#          }
#        }
#      }
    }

    @bridge = new Bridge(@app)

  it 'subscribe', ->
    handler = sinon.spy()
    @bridge.subscribe(@toHost, @category, @topic, handler)

    sinon.assert.calledWith(@app.network.send, @toHost, {

    })
