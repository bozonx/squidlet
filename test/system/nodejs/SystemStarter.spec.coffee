SystemStarter = require('../../../nodejs/starter/SystemStarter').default


describe.only 'nodejs.ProdBuild', ->
  beforeEach ->
    @props = {
      workDir: 'workDir'
      envSetDir: 'envSetDir'
      tmpDir: 'tmpDir'
      destroyTimeoutSec: 0
    }
    @systemStarter = new SystemStarter(@props)

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

    @systemStarter.requireSystemClass = sinon.stub().returns(SystemClass)
    @systemStarter.listenDestroySignals = sinon.spy()

    await @systemStarter.start(pathToSystem, ioSet);

    sinon.assert.calledOnce(@systemStarter.requireSystemClass)
    sinon.assert.calledWith(@systemStarter.requireSystemClass, pathToSystem)
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
    @systemStarter.processExit = sinon.spy()

    await @systemStarter.gracefullyDestroyCb(destroy)

    sinon.assert.calledOnce(destroy)
    sinon.assert.calledOnce(@systemStarter.processExit)
    sinon.assert.calledWith(@systemStarter.processExit, 0)

  it 'gracefullyDestroyCb - badly destroy', ->
    destroy = sinon.stub().returns(Promise.reject('err'))
    @systemStarter.processExit = sinon.spy()

    await @systemStarter.gracefullyDestroyCb(destroy)

    sinon.assert.calledOnce(destroy)
    sinon.assert.calledOnce(@systemStarter.processExit)
    sinon.assert.calledWith(@systemStarter.processExit, 2)

  it 'gracefullyDestroyCb - timeout exceeded', ->
    destroyPromise = new Promise((resolve) =>
      setTimeout(() =>
        resolve()
      , 1)
    )
    destroy = sinon.stub().returns(destroyPromise)
    @systemStarter.processExit = sinon.spy()

    await @systemStarter.gracefullyDestroyCb(destroy)

    sinon.assert.notCalled(destroy)
    sinon.assert.calledOnce(@systemStarter.processExit)
    sinon.assert.calledWith(@systemStarter.processExit, 3)
