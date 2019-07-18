SystemStarter = require('../../../nodejs/starter/SystemStarter').default


describe.only 'nodejs.ProdBuild', ->
  beforeEach ->
    @props = {
      workDir: 'workDir'
      envSetDir: 'envSetDir'
      tmpDir: 'tmpDir'
      destroyTimeoutSec: 60
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

  it 'makeSystemConfigExtend', ->
    # TODO: !!!

  it 'listenDestroySignals', ->
    # TODO: !!!
