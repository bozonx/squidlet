IoSetDevelopSource = require('../../../nodejs/starter/IoSetDevelopSource').default
helpers = require('../../../shared/helpers')


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
    machineConfig = {
      ios: ['./io/Storage.ts']
    }

    @ioSource.os = {
      #require: sinon.stub()
      require: () => {default: machineConfig}
    }

    @ioSource.instantiateIo = sinon.spy();

    await @ioSource.init()

    sinon.assert.calledOnce(@ioSource.instantiateIo)
    sinon.assert.calledWith(@ioSource.instantiateIo, machineConfig.ios[0], helpers.resolvePlatformDir('nodejs'))

  it 'instantiateIo', ->
    @ioSource.instantiateIo()
