Status = require('../../src/baseDevice/Status').default


describe.only 'baseDevice.Status', ->
  beforeEach ->
    @system = {
      host: {
        id: 'master'
      }
    }
    @schema = {

    }
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

  it 'init', ->
    # TODO: !!!!

  it 'read - use local', ->
    @status.localData = @data

    @getter = undefined
    result = await @status.read()

    assert.deepEqual(result, @data)
    sinon.assert.notCalled(@publisher)

  it 'read - use getter', ->
    result = await @status.read()

    assert.deepEqual(result, @data)
    assert.deepEqual(@status.localData, @data)
    sinon.assert.calledTwice(@publisher)
    sinon.assert.calledWith(@publisher, 'status', 1)
    sinon.assert.calledWith(@publisher, 'status/temperature', 25)

  it 'readParam - use local', ->
    @status.localData = @data

    @getter = undefined
    result = await @status.readParam('default')

    assert.deepEqual(result, 1)
    sinon.assert.notCalled(@publisher)

  it 'readParam - use getter', ->
    result = await @status.readParam('default')

    assert.deepEqual(result, 1)
    assert.deepEqual(@status.localData, {default: 1})
    sinon.assert.calledOnce(@publisher)
    sinon.assert.calledWith(@publisher, 'status', 1)
