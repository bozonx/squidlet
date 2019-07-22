IoSetDevelopSource = require('../../../nodejs/starter/IoSetDevelopSource').default


describe.only 'nodejs.IoSetDevelopSource', ->
  beforeEach ->
    @os = {}
    @envBuilder = {}
    @envSetDir = 'envSetDir'
    @platform = 'nodejs'
    @machine = 'x86'
    @ioSource = new IoSetDevelopSource(@os, @envBuilder, @envSetDir, @platform, @machine)

  it 'prepare', ->
    @ioSource.storageWrapper.init = sinon.stub().returns(Promise.resolve())

    await @ioSource.prepare()

    sinon.assert.calledOnce(@ioSource.storageWrapper.init)

  it 'init', ->

