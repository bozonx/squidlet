Switch = require('../../../../entities/devices/Switch/Switch').default


describe 'devices.Switch', ->
  beforeEach ->
    @readResult = Promise.resolve(true)
    @writePromise = Promise.resolve()
    @readSpy = sinon.spy()
    @outputDriver = {
      read: () =>
        @readSpy()
        return @readResult
      write: sinon.stub().returns(@writePromise)
      isBlocked: => false
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
        drivers: ['BinaryOutput.driver']
      })
      getDriver: => {
        getInstance: => @outputDriver
      }
    }

    @definition = {
      deviceId: 'room1.device1'
      className: 'Switch'
      props: {
        blockTime: 0
      }
    }
    @handleStatusChange = sinon.spy()
    @switch = new Switch(@definition, @env)
    @switch.publish = sinon.spy()

    await @switch.init()

    @switch.onChange(@handleStatusChange)

  it "turn", () ->
    result = await @switch.action('turn', 0)

    await @writePromise

    sinon.assert.calledOnce(@outputDriver.write)
    sinon.assert.calledWith(@outputDriver.write, false)
    assert.isFalse(result)
    assert.isFalse(@switch.status.getState().default)

    # TODO: once or twice ???
    sinon.assert.calledOnce(@handleStatusChange);
    sinon.assert.calledWith(@handleStatusChange, ['default']);

    sinon.assert.calledThrice(@switch.publish)
    # on init
    sinon.assert.calledWith(@switch.publish.getCall(0), 'status', true)
    # on call action and setStatus()
    sinon.assert.calledWith(@switch.publish.getCall(1), 'status', false)
    # after call action
    sinon.assert.calledWith(@switch.publish.getCall(2), 'turn', false)

  it "toggle 1=>0", ->
    @switch.actions.turn = sinon.spy()

    await @switch.action('toggle')

    assert.isFalse(@switch.status.getState().default)
    sinon.assert.calledOnce(@outputDriver.write)
    sinon.assert.calledWith(@outputDriver.write, false)

  it "toggle 0=>1", ->
    @readResult = Promise.resolve(false)
    @switch.actions.turn = sinon.spy()

    await @switch.action('toggle')

    assert.isTrue(@switch.status.getState().default)
    sinon.assert.calledOnce(@outputDriver.write)
    sinon.assert.calledWith(@outputDriver.write, true)


#  it "turn - blockTime", () ->
#    clock = sinon.useFakeTimers()
#
#    await @switch.action('turn', 1)
#    sinon.assert.calledOnce(@outputDriver.write)
#
#    await @switch.action('turn', 0)
#    sinon.assert.calledOnce(@outputDriver.write)
#
#    clock.tick(100)
#
#    await @switch.action('turn', 1)
#    sinon.assert.calledTwice(@outputDriver.write)
#
#    clock.restore()
#
#  it "toggle - blockTime", () ->
#    clock = sinon.useFakeTimers()
#
#    @readResult = Promise.resolve(true)
#    @switch.actions.turn = sinon.stub().returns(Promise.resolve());
#
#    await @switch.action('toggle')
#    sinon.assert.calledOnce(@outputDriver.write)
#
#    await @switch.action('toggle')
#    sinon.assert.calledOnce(@outputDriver.write)
#
#    clock.tick(100)
#
#    await @switch.action('toggle')
#    sinon.assert.calledTwice(@outputDriver.write)
#
#    clock.restore()
