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
    # TODO: !!!!

  it 'read - use getter', ->
    result = await @status.read()

    assert.deepEqual(result, @data)
    assert.deepEqual(@status.localData, @data)

    sinon.assert.calledWith(@publisher, 'status', 1)
    sinon.assert.calledWith(@publisher, 'status/temperature', 25)

  it 'readParam - use local', ->
    # TODO: !!!!

  it 'readParam - use getter', ->
    # TODO: !!!!
