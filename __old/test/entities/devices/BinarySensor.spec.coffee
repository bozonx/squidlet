BinarySensor = require('../../../../entities/devices/BinarySensor/BinarySensor').default


describe 'devices.BinarySensor', ->
  beforeEach ->
    @readResult = Promise.resolve(false)
    @readSpy = sinon.spy()
    @inputDriver = {
      read: () =>
        @readSpy()
        return @readResult
      addListener: sinon.spy()
    }
    @env = {
      system: {
        host: {
          config: {
            config: {
              #defaultStatusRepublishIntervalMs: 0
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
        drivers: ['BinaryInput.driver']
      })
      getDriver: => {
        getInstance: => @inputDriver
      }
    }
    @definition = {
      id: 'room1.device1'
      className: 'BinarySensor'
      props: {
        debounce: 0
        blockTime: 0
      }
    }
    @handleStatusChange = sinon.spy()
    @binarySensor = new BinarySensor(@definition, @env)
    @binarySensor.publish = sinon.spy()

    await @binarySensor.init()

    @binarySensor.onChange(@handleStatusChange)

  it 'init', ->
    assert.deepEqual(@binarySensor.status.localData, { default: false })
    sinon.assert.calledOnce(@readSpy)
    sinon.assert.calledOnce(@inputDriver.addListener)

  it 'check status', ->
    # like driver has risen an event
    await @binarySensor.onInputChange(true)

    assert.deepEqual(@binarySensor.status.localData, { default: true })



#  it "main logic - debounceType = debounce", ->
#    clock = sinon.useFakeTimers()
#
#    # like driver has risen an event
#    @binarySensor.onInputChange(true)
#
#    assert.isTrue(@binarySensor.blockTimeInProgress)
#
#    await @readResult
#
#    # after setStatus
#    assert.equal(@binarySensor.status.getState().default, true)
#
#    sinon.assert.calledOnce(@handleStatusChange);
#    sinon.assert.calledWith(@handleStatusChange, ['default']);
#
#    clock.tick(50)
#
#    assert.isFalse(@binarySensor.blockTimeInProgress)
#
#    clock.restore()
#
#    sinon.assert.calledTwice(@binarySensor.publish)
#    sinon.assert.calledWith(@binarySensor.publish, 'status', false)
#    sinon.assert.calledWith(@binarySensor.publish, 'status', true)
#
#  it "main logic - debounceType = throttle", ->
#    @definition.props.debounceType = 'throttle'
#    assert.equal(@binarySensor.status.getState().default, false)
#
#    @readResult = Promise.resolve(true)
#    clock = sinon.useFakeTimers()
#
#    # like driver has risen an event
#    @binarySensor.onInputChange()
#
#    assert.isTrue(@binarySensor.throttleInProgress)
#    assert.isFalse(@binarySensor.blockTimeInProgress)
#
#    # wait for debounce time has finished and startValueLogic has started
#    clock.tick(30)
#
#    assert.isFalse(@binarySensor.throttleInProgress)
#    assert.isTrue(@binarySensor.blockTimeInProgress)
#
#    await @readResult
#
#    # after setStatus
#    assert.equal(@binarySensor.status.getState().default, true)
#
#    sinon.assert.calledOnce(@handleStatusChange);
#    sinon.assert.calledWith(@handleStatusChange, ['default']);
#
#    clock.tick(50)
#
#    assert.isFalse(@binarySensor.throttleInProgress)
#    assert.isFalse(@binarySensor.blockTimeInProgress)
#
#    clock.restore()
#
#    sinon.assert.calledTwice(@binarySensor.publish)
#    sinon.assert.calledWith(@binarySensor.publish, 'status', false)
#    sinon.assert.calledWith(@binarySensor.publish, 'status', true)
