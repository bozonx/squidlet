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
          devices: {
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

  it.only "turn - deadTime", () ->
    clock = sinon.useFakeTimers()

    @initInstance()
    await @switch.init()

    @gpio.setLevel = sinon.stub().returns(Promise.resolve());

    await @switch.turn(1)
    sinon.assert.calledOnce(@gpio.setLevel)

    await @switch.turn(0)
    sinon.assert.calledOnce(@gpio.setLevel)

    clock.tick(100)

    await @switch.turn(1)
    sinon.assert.calledTwice(@gpio.setLevel)

    clock.restore()

  it "toggle 1=>0", ->
    @initInstance()
    await @switch.init()
    @switch.turn = sinon.spy()
    await @switch.toggle()

    sinon.assert.calledOnce(@switch.turn)
    sinon.assert.calledWith(@switch.turn, 0)

  it "toggle 0=>1", ->
    @initInstance()
    await @switch.init()
    @gpio.getLevel = sinon.stub().returns(Promise.resolve(0))
    @switch.turn = sinon.spy()
    await @switch.toggle()

    sinon.assert.calledOnce(@switch.turn)
    sinon.assert.calledWith(@switch.turn, 1)

  it "toggle - deadTime", () ->
    clock = sinon.useFakeTimers()

    @initInstance()
    await @switch.init()

    @gpio.getLevel = sinon.stub().returns(Promise.resolve(1));
    @switch.turn = sinon.stub().returns(Promise.resolve());

    await @switch.toggle(1)
    sinon.assert.calledOnce(@switch.turn)

    await @switch.toggle(0)
    sinon.assert.calledOnce(@switch.turn)

    clock.tick(100)

    await @switch.toggle(1)
    sinon.assert.calledTwice(@switch.turn)

    clock.restore()
