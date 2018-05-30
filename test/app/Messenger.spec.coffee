Messenger = require('../../src/app/Messenger').default


describe 'app.Messenger', ->
  beforeEach ->
    @app = {
      host: {
        getId: -> 'master'
      }
      router: {
        publish: sinon.spy()
      }
    }

    @to = {
      hostId: 'room1.host1'
      type: 'i2c'
      bus: '1'
      address: '5A'
    }

    @messenger = new Messenger(@app);

  it 'publish', ->
    await @messenger.publish(@to, 'deviceCallAction', 'room1.device1', { data: 'value' })

    sinon.assert.calledWith(@app.router.publish, {

    })

