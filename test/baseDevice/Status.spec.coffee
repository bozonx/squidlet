Status = require('../../src/baseDevice/Status').default


describe.only 'baseDevice.Status', ->
  beforeEach ->
    @system = {
      host: {
        id: 'master'
      }
    }
    @schema = {
      default: {
        type: 'number'
        default: 0
      }
      temperature: {
        type: 'number'
      }
    }
    @handler = sinon.spy()
    @data = {
      default: 1
      temperature: 25
    }
    @publisher = sinon.spy()
    @getter = sinon.stub().returns(Promise.resolve(@data))
    @setter = sinon.stub().returns(Promise.resolve())

    @deviceId = 'room/host1$device1'
    @status = new Status(
      @deviceId,
      @system,
      @schema,
      @publisher,
      1000,
      @getter,
      @setter
    )
    @status.onChange(@handler)

  it 'init - with getter - load data', ->
    @status.read = sinon.spy()

    await @status.init()

    sinon.assert.calledOnce(@status.read)

  it 'init - without getter - set defaults', ->
    @status.getter = undefined

    await @status.init()

    assert.deepEqual(@status.localData, {default: 0})

  it 'read - use local', ->
    @status.localData = @data

    @status.getter = undefined
    result = await @status.read()

    assert.deepEqual(result, @data)
    sinon.assert.notCalled(@publisher)
    sinon.assert.notCalled(@handler)

  it 'read - use getter', ->
    result = await @status.read()

    assert.deepEqual(result, @data)
    assert.deepEqual(@status.localData, @data)
    sinon.assert.calledTwice(@publisher)
    sinon.assert.calledWith(@publisher, 'status', 1)
    sinon.assert.calledWith(@publisher, 'status/temperature', 25)
    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, ['default', 'temperature'])

  it 'readParam - use local', ->
    @status.localData = @data

    @status.getter = undefined
    result = await @status.readParam('default')

    assert.deepEqual(result, 1)
    sinon.assert.notCalled(@publisher)
    sinon.assert.notCalled(@handler)

  it 'readParam - use getter', ->
    result = await @status.readParam('default')

    assert.deepEqual(result, 1)
    assert.deepEqual(@status.localData, {default: 1})
    sinon.assert.calledOnce(@publisher)
    sinon.assert.calledWith(@publisher, 'status', 1)
    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, ['default'])

  it 'write - use local', ->
    @status.setter = undefined
    @status.localData = {
      default: 0
      temperature: 25
    }

    await @status.write({default: 1})

    assert.deepEqual(@status.localData, @data)
    sinon.assert.calledOnce(@publisher)
    sinon.assert.calledWith(@publisher, 'status', 1)
    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, ['default'])

  it 'write - use getter', ->
    await @status.write(@data)

    assert.deepEqual(@status.localData, @data)
    sinon.assert.calledTwice(@publisher)
    sinon.assert.calledWith(@publisher, 'status', 1)
    sinon.assert.calledWith(@publisher, 'status/temperature', 25)
    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, ['default', 'temperature'])
