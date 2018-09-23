BinarySensor = require('../../host/src/devices/BinarySensor/BinarySensor').default


describe.only 'devices.BinarySensor', ->
  beforeEach ->
    @getLevelResult = Promise.resolve(0)
    @inputDriver = {
      getLevel: => @getLevelResult
      onChange: =>
      #getLevel: sinon.stub().returns(Promise.resolve(1))
    }
    @env = {
      system: {
        host: {
          config: {
            config: {
              defaultStatusRepublishIntervalMs: 0
            }
          }
        }
      }
      loadManifest: => Promise.resolve({
        status: {
          default: {
            type: 'number'
          }
        }
        drivers: ['DigitalInput.driver']
      })
      getDriver: => {
        getInstance: => @inputDriver
      }
    }
    @definition = {
      id: 'room1.device1'
      className: 'BinarySensor'
      props: {
        debounce: 30
        blockTime: 50
      }
    }
    @handleStatusChange = sinon.spy()
    @binarySensor = new BinarySensor(@definition, @env)
    @binarySensor.publish = sinon.spy()

    await @binarySensor.init()

    @binarySensor.onChange(@handleStatusChange)


  it "main logic", ->
#    assert.equal(@binarySensor.status.getLocal().default, 0)
#
#    @getLevelResult = Promise.resolve(1)
#    clock = sinon.useFakeTimers()
#
#
#
#    # like driver has risen an event
#    @binarySensor.onInputChange()
#
#    assert.isTrue(@binarySensor.debounceInProgress)
#    assert.isFalse(@binarySensor.blockTimeInProgress)
#
#    # wait for debounce time has finished and startValueLogic has started
#    clock.tick(20)
#
#    assert.isFalse(@binarySensor.debounceInProgress)
#    assert.isTrue(@binarySensor.blockTimeInProgress)
#
#    await @getLevelResult
#
#    # after setStatus
#    assert.equal(@binarySensor.status.getLocal().default, 1)
#
#    sinon.assert.calledTwice(@handleStatusChange);
#    sinon.assert.calledWith(@handleStatusChange, ['default']);
#
#    clock.tick(50)
#
#    assert.isFalse(@binarySensor.debounceInProgress)
#    assert.isFalse(@binarySensor.blockTimeInProgress)
#
#    clock.restore()
#
#    sinon.assert.calledTwice(@binarySensor.publish)
#    sinon.assert.calledWith(@binarySensor.publish, 'status', 0)
#    sinon.assert.calledWith(@binarySensor.publish, 'status', 1)
