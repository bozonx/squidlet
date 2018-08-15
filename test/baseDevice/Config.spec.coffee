Config = require('../../src/baseDevice/Config').default


describe 'baseDevice.Config', ->
  beforeEach ->
    @system = {
      host: {
        config: {
          devices: {
            defaultStatusRepublishIntervalMs: 1000
          }
        }
      }
    }
    @schema = {
      param1: {
        type: 'number'
        default: 500
      }
    }
    @handler = sinon.spy()
    @data = {
      param1: 600
    }
    @publisher = sinon.spy()
    @getter = sinon.stub().returns(Promise.resolve(@data))
    @setter = sinon.stub().returns(Promise.resolve())

    @deviceId = 'room/host1$device1'
    @config = new Config(
      @deviceId,
      @system,
      @schema,
      @publisher,
      undefined,
      @getter,
      @setter
    )
    @config.onChange(@handler)

  it 'init - with getter - load data', ->
    @config.read = sinon.spy()

    await @config.init()

    sinon.assert.calledOnce(@config.read)

  it 'init - without getter - set defaults', ->
    @config.getter = undefined

    await @config.init()

    assert.deepEqual(@config.localData, {param1: 500})

  it 'read - use local', ->
    @config.localData = @data

    @config.getter = undefined
    result = await @config.read()

    assert.deepEqual(result, @data)
    sinon.assert.notCalled(@publisher)
    sinon.assert.notCalled(@handler)

  it 'read - use getter', ->
    result = await @config.read()

    assert.deepEqual(result, @data)
    assert.deepEqual(@config.localData, @data)
    sinon.assert.calledOnce(@publisher)
    sinon.assert.calledWith(@publisher, 'config', { param1: 600 })
    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, ['param1'])

  it 'write - use local', ->
    @config.setter = undefined
    @config.localData = {
      param1: 500
    }

    await @config.write(@data)

    assert.deepEqual(@config.localData, @data)
    sinon.assert.calledOnce(@publisher)
    sinon.assert.calledWith(@publisher, 'config', { param1: 600 })
    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, ['param1'])

  it 'write - use getter', ->
    await @config.write(@data)

    assert.deepEqual(@config.localData, @data)
    sinon.assert.calledOnce(@publisher)
    sinon.assert.calledWith(@publisher, 'config', { param1: 600 })
    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, ['param1'])
