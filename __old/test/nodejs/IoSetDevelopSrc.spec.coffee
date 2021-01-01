IoSetDevelopSrc = require('../../../../squidlet-networking/src/io/nodejs/ioSets/IoSetDevelopSrc').default
helpers = require('../../shared/helpers/helpers')


describe 'nodejs.IoSetDevelopSrc', ->
  beforeEach ->
    @os = {}
    @envBuilder = {}
    @envSetDir = 'envSetDir'
    @platform = 'nodejs'
    @machine = 'x86'
    @ioSrc = new IoSetDevelopSrc(@os, @envBuilder, @envSetDir, @platform, @machine)

  it 'prepare', ->
    @ioSrc.storageWrapper.init = sinon.stub().returns(Promise.resolve())

    await @ioSrc.prepare()

    sinon.assert.calledOnce(@ioSrc.storageWrapper.init)

  it 'init', ->
    machineConfig = {
      ios: ['./platforms/Storage.ts']
    }

    @ioSrc.os = {
      require: () => {default: machineConfig}
    }

    @ioSrc.instantiateIo = sinon.spy();

    await @ioSrc.init()

    sinon.assert.calledOnce(@ioSrc.instantiateIo)
    sinon.assert.calledWith(@ioSrc.instantiateIo, machineConfig.ios[0], helpers.resolvePlatformDir('nodejs'))

  it 'instantiateIo - common platforms', ->
    ioPath = './platforms/DigitalInputSemiDuplex.ts'
    platformDir = helpers.resolvePlatformDir('nodejs')
    class DigitalClass
    @ioSrc.os = {
      require: () => {default: DigitalClass}
    }

    @ioSrc.instantiateIo(ioPath, platformDir)

    assert.isTrue(@ioSrc.ioCollection['Digital'] instanceof DigitalClass)

  it 'instantiateIo - Storage platforms - it uses storage wrapper', ->
    ioPath = './platforms/Storage.ts'
    platformDir = helpers.resolvePlatformDir('nodejs')
    class StorageClass
    wrapperArg = undefined
    wrapperObject = {
      readFile: () =>
    }
    @ioSrc.os = {
      require: () => {default: StorageClass}
    }
    @ioSrc.storageWrapper = {
      makeWrapper: (arg) =>
        wrapperArg = arg
        wrapperObject
    }

    @ioSrc.instantiateIo(ioPath, platformDir)

    assert.isTrue(wrapperArg instanceof StorageClass)
    assert.equal(@ioSrc.ioCollection['Storage'], wrapperObject)
