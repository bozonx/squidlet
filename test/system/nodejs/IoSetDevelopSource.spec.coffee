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
      require: () => {default: machineConfig}
    }

    @ioSource.instantiateIo = sinon.spy();

    await @ioSource.init()

    sinon.assert.calledOnce(@ioSource.instantiateIo)
    sinon.assert.calledWith(@ioSource.instantiateIo, machineConfig.ios[0], helpers.resolvePlatformDir('nodejs'))

  it 'instantiateIo - common io', ->
    ioPath = './io/Digital.ts'
    platformDir = helpers.resolvePlatformDir('nodejs')
    class DigitalClass
    @ioSource.os = {
      require: () => {default: DigitalClass}
    }

    @ioSource.instantiateIo(ioPath, platformDir)

    assert.isTrue(@ioSource.ioCollection['Digital'] instanceof DigitalClass)

  it 'instantiateIo - Storage io - it uses storage wrapper', ->
    # TODO: !!!!
