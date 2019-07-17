StartDevelop = require('../../../nodejs/starter/StartDevelop').default


describe.only 'nodejs.StartDevelop', ->
  beforeEach ->
    @configPath = 'path/to/config'
    @argHostName = 'testHost'
    @x86Machine = 'x86'
    @workDir = 'testHost'
    @hostConfog = {
      id: @argHostName
      platform: 'nodejs'
    }
    @fakeProps = {
      workDir: @workDir
      envSetDir: 'envSetDir'
      varDataDir: 'varDataDir'
      tmpDir: 'tmoDir'
      platform: 'nodejs'
      hostId: @argHostName
      force: false
      hostConfig: @hostConfog
    }

    @newInstance = (argMachine, argWorkDir, argForce = false) =>
      new StartDevelop(@configPath, argForce, argMachine, @argHostName, argWorkDir)

  it 'init - init groupConfig, props and make envBuilder instance', ->
    startDevelop = @newInstance(@x86Machine, @workDir)

    startDevelop.groupConfig.init = sinon.stub().returns(Promise.resolve());
    startDevelop.groupConfig.getHostConfig = () => @hostConfog

    await startDevelop.init()

    sinon.assert.calledOnce(startDevelop.groupConfig.init)
    assert.deepEqual(startDevelop._envBuilder.configManager.hostConfigOrConfigPath, @hostConfog)
    assert.equal(startDevelop._envBuilder.buildDir, startDevelop.props.envSetDir)
    assert.equal(startDevelop._envBuilder.tmpBuildDir, "#{startDevelop.props.tmpDir}/envSet")

  it 'start', ->
    SystemClass = class Sys
    ioSet = { init: () -> }
    pathToSystemFile = 'path/to/System'
    startDevelop = @newInstance(@x86Machine, @workDir)

    startDevelop.props = @fakeProps
    startDevelop._envBuilder = {
      collect: sinon.stub().returns(Promise.resolve())
    }
    startDevelop.os = {
      mkdirP: sinon.stub().returns(Promise.resolve())
    }
    startDevelop.installModules = sinon.stub().returns(Promise.resolve())
    startDevelop.getPathToProdSystemFile = sinon.stub().returns(pathToSystemFile)
    startDevelop.requireSystemClass = sinon.stub().returns(SystemClass)
    startDevelop.makeIoSet = sinon.stub().returns(ioSet)
    startDevelop.startSystem = sinon.stub().returns(Promise.resolve())

    await startDevelop.start()

    sinon.assert.calledOnce(startDevelop.envBuilder.collect)
    sinon.assert.calledTwice(startDevelop.os.mkdirP)
    sinon.assert.calledWith(startDevelop.os.mkdirP.getCall(0), @fakeProps.varDataDir)
    sinon.assert.calledWith(startDevelop.os.mkdirP.getCall(1), @fakeProps.envSetDir)
    sinon.assert.calledOnce(startDevelop.installModules)
    sinon.assert.calledOnce(startDevelop.requireSystemClass)
    sinon.assert.calledWith(startDevelop.requireSystemClass, pathToSystemFile)
    sinon.assert.calledOnce(startDevelop.startSystem)
    sinon.assert.calledWith(startDevelop.startSystem, SystemClass, ioSet)
