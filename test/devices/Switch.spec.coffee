Switch = require('../../src/devices/Switch/Switch').default


describe 'devices.Switch', ->
  beforeEach ->
    @getLevelResult = Promise.resolve(true)
    @setLevelPromise = Promise.resolve()
    @driver = {
      getLevel: => @getLevelResult
      setLevel: sinon.stub().returns(@setLevelPromise)
    }
    @system = {
      drivers: {
        getDriver: => {
          getInstance: => @driver
        }
      }
      host: {
        config: {
          host: {
            defaultStatusRepublishIntervalMs: 0
          }
        }
      }
    }
    @deviceConf = {
      deviceId: 'room1.device1'
      manifest: {
        status: {
          default: {
            type: 'number'
          }
        }
      }
      props: {
        deadTime: 50
      }
    }
    @handleStatusChange = sinon.spy()
    @switch = new Switch(@system, @deviceConf)
    @switch.publish = sinon.spy()
    @switch.onChange(@handleStatusChange)
    await @switch.init()

  it "turn", () ->
    result = await @switch.action('turn', 0)

    await @setLevelPromise

    sinon.assert.calledOnce(@driver.setLevel)
    sinon.assert.calledWith(@driver.setLevel, false)
    assert.isFalse(result)
    assert.isFalse(@switch.status.getLocal().default)

    sinon.assert.calledTwice(@handleStatusChange);
    sinon.assert.calledWith(@handleStatusChange, ['default']);

    sinon.assert.calledThrice(@switch.publish)
    # on init
    sinon.assert.calledWith(@switch.publish.getCall(0), 'status', true)
    # on call action and setStatus()
    sinon.assert.calledWith(@switch.publish.getCall(1), 'status', false)
    # after call action
    sinon.assert.calledWith(@switch.publish.getCall(2), 'turn', false)

  it "turn - deadTime", () ->
    clock = sinon.useFakeTimers()

    await @switch.action('turn', 1)
    sinon.assert.calledOnce(@driver.setLevel)

    await @switch.action('turn', 0)
    sinon.assert.calledOnce(@driver.setLevel)

    clock.tick(100)

    await @switch.action('turn', 1)
    sinon.assert.calledTwice(@driver.setLevel)

    clock.restore()

  it "toggle 1=>0", ->
    @switch.actions.turn = sinon.spy()

    await @switch.action('toggle')

    sinon.assert.calledOnce(@switch.actions.turn)
    sinon.assert.calledWith(@switch.actions.turn, false)

  it "toggle 0=>1", ->
    @getLevelResult = Promise.resolve(false)
    @switch.actions.turn = sinon.spy()

    await @switch.action('toggle')

    sinon.assert.calledOnce(@switch.actions.turn)
    sinon.assert.calledWith(@switch.actions.turn, true)

  it "toggle - deadTime", () ->
    clock = sinon.useFakeTimers()

    @getLevelResult = Promise.resolve(true)
    @switch.actions.turn = sinon.stub().returns(Promise.resolve());

    await @switch.action('toggle')
    sinon.assert.calledOnce(@switch.actions.turn)

    await @switch.action('toggle')
    sinon.assert.calledOnce(@switch.actions.turn)

    clock.tick(100)

    await @switch.action('toggle')
    sinon.assert.calledTwice(@switch.actions.turn)

    clock.restore()
