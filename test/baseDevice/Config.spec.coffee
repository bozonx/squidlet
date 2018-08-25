Config = require('../../host/src/baseDevice/Config').default


describe 'baseDevice.Config', ->
  beforeEach ->
    @system = {
      host: {
        config: {
          host: {
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
    )
    @config.onChange(@handler)
    @init = => @config.init(@getter, @setter)

  it 'init - with getter - load data', ->
    @config.read = sinon.spy()

    await @init()

    sinon.assert.calledOnce(@config.read)

  it 'init - without getter - set defaults', ->
    @getter = undefined

    await @init()

    assert.deepEqual(@config.localData, {param1: 500})

  it 'read - use local', ->
    @config.localData = @data

    @config.getter = undefined
    result = await @config.read()

    assert.deepEqual(result, @data)
    sinon.assert.notCalled(@publisher)
    sinon.assert.notCalled(@handler)

  it 'read - use getter', ->
    await @init()
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
    await @init()
    await @config.write(@data)

    assert.deepEqual(@config.localData, @data)
    sinon.assert.calledOnce(@publisher)
    sinon.assert.calledWith(@publisher, 'config', { param1: 600 })
    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, ['param1'])
