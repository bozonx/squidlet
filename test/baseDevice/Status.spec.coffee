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
    @publisher = () =>
    @getter = () =>
    @setter = () =>

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

  it 'read', ->
