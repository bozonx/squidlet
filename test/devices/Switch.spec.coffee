Switch = require('../../src/devices/Switch/Switch').default


describe.only 'devices.Switch', ->
  beforeEach ->
    #@getLevelResult = Promise.resolve(1)
    @driver = {
#      getLevel: => @getLevelResult
#      onChange: =>
      #getLevel: sinon.stub().returns(Promise.resolve(1))
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
    @switch = new Switch(@system, @deviceConf)
    #@switch.publish = sinon.spy()

  it "turn", () ->
    await @initInstance()

    @switchBase.$handleStatusChange = sinon.spy()

    await @switchBase.init()

    await @switchBase.turn(0)

    sinon.assert.calledOnce(@gpio.setLevel)
    sinon.assert.calledWith(@gpio.setLevel, 0)
    assert.equal(@switchBase.statusCtl.getLastStatus(), 0)

    sinon.assert.calledTwice(@switchBase.$handleStatusChange)
    sinon.assert.calledWith(@switchBase.$handleStatusChange, 'path/to/status', 0, { isRepeat: false })

  it "turn - deadTime", () ->
    clock = sinon.useFakeTimers()

    @initInstance()
    await @switchBase.init()

    @gpio.setLevel = sinon.stub().returns(Promise.resolve());

    await @switchBase.turn(1)
    sinon.assert.calledOnce(@gpio.setLevel)

    await @switchBase.turn(0)
    sinon.assert.calledOnce(@gpio.setLevel)

    clock.tick(100)

    await @switchBase.turn(1)
    sinon.assert.calledTwice(@gpio.setLevel)

    clock.restore()

  it "toggle 1=>0", ->
    @initInstance()
    await @switchBase.init()
    @switchBase.turn = sinon.spy()
    await @switchBase.toggle()

    sinon.assert.calledOnce(@switchBase.turn)
    sinon.assert.calledWith(@switchBase.turn, 0)

  it "toggle 0=>1", ->
    @initInstance()
    await @switchBase.init()
    @gpio.getLevel = sinon.stub().returns(Promise.resolve(0))
    @switchBase.turn = sinon.spy()
    await @switchBase.toggle()

    sinon.assert.calledOnce(@switchBase.turn)
    sinon.assert.calledWith(@switchBase.turn, 1)

  it "toggle - deadTime", () ->
    clock = sinon.useFakeTimers()

    @initInstance()
    await @switchBase.init()

    @gpio.getLevel = sinon.stub().returns(Promise.resolve(1));
    @switchBase.turn = sinon.stub().returns(Promise.resolve());

    await @switchBase.toggle(1)
    sinon.assert.calledOnce(@switchBase.turn)

    await @switchBase.toggle(0)
    sinon.assert.calledOnce(@switchBase.turn)

    clock.tick(100)

    await @switchBase.toggle(1)
    sinon.assert.calledTwice(@switchBase.turn)

    clock.restore()
