Messenger = require('../../src/app/Messenger').default


describe 'app.Messenger', ->
  beforeEach ->
    @app = {
      host: {
        generateDestination: (type, bus) ->
          {
            host: 'master'
            type
            bus
            address: undefined
          }
      }
      router: {
        publish: sinon.spy()
      }
    }

    @to = {
      host: 'room1.host1'
      type: 'i2c'
      bus: '1'
      address: '5A'
    }

    @messenger = new Messenger(@app);

  it 'publish', ->
    await @messenger.publish(@to, 'deviceCallAction', 'room1.device1', { data: 'value' })

    sinon.assert.calledWith(@app.router.publish, {
      category: 'deviceCallAction',
      from: { address: undefined , bus: '1', host: 'master', type: 'i2c' },
      payload: { data: 'value' },
      to: { address: '5A', bus: '1', host: 'room1.host1', type: 'i2c' },
      topic: 'room1.device1'
    })

  it 'subscribe', ->
