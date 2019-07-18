SystemStarter = require('../../../nodejs/starter/SystemStarter').default


describe.only 'nodejs.ProdBuild', ->
  beforeEach ->
    @os = {
      processExit: sinon.spy()
    }
    @props = {
      workDir: 'workDir'
      envSetDir: 'envSetDir'
      tmpDir: 'tmpDir'
      destroyTimeoutSec: 0
    }
    @systemStarter = new SystemStarter(@os, @props)

  it 'start', ->
    pathToSystem = 'path/to/system'
    ioSet = { init: () -> }
    constructorIoSet = undefined
    constructorConfigExtend = undefined
    startMethod = sinon.stub().returns(Promise.resolve())
    destroyMethod = () =>

    class SystemClass
      constructor: (receivedIoSet, receivedConfigExtend) ->
        constructorIoSet = receivedIoSet
        constructorConfigExtend = receivedConfigExtend

      start: startMethod
      destroy: destroyMethod

    @os.require = sinon.stub().returns({default: SystemClass})
    @systemStarter.listenDestroySignals = sinon.spy()

    await @systemStarter.start(pathToSystem, ioSet);

    sinon.assert.calledOnce(@os.require)
    sinon.assert.calledWith(@os.require, pathToSystem)
    sinon.assert.calledOnce(@systemStarter.listenDestroySignals)
    sinon.assert.calledWith(@systemStarter.listenDestroySignals, destroyMethod)
    sinon.assert.calledOnce(startMethod)
    assert.equal(constructorIoSet, ioSet)
    assert.deepEqual(constructorConfigExtend, {
      rootDirs: {
        envSet: 'envSetDir'
        varData: 'workDir/varData',
        tmp: 'tmpDir/host',
      }
    })

  it 'gracefullyDestroyCb - normally destroy', ->
    destroy = sinon.stub().returns(Promise.resolve())

    await @systemStarter.gracefullyDestroyCb(destroy)

    sinon.assert.calledOnce(destroy)
    sinon.assert.calledOnce(@os.processExit)
    sinon.assert.calledWith(@os.processExit, 0)

  it 'gracefullyDestroyCb - badly destroy', ->
    destroy = sinon.stub().returns(Promise.reject('err'))

    await @systemStarter.gracefullyDestroyCb(destroy)

    sinon.assert.calledOnce(destroy)
    sinon.assert.calledOnce(@os.processExit)
    sinon.assert.calledWith(@os.processExit, 2)

  it 'gracefullyDestroyCb - timeout exceeded', ->
    destroyPromise = new Promise((resolve) =>
      setTimeout(() =>
        resolve()
      , 1)
    )
    destroy = sinon.stub().returns(destroyPromise)

    await @systemStarter.gracefullyDestroyCb(destroy)

    sinon.assert.notCalled(destroy)
    sinon.assert.calledOnce(@os.processExit)
    sinon.assert.calledWith(@os.processExit, 3)
