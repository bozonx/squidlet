StartProd = require('../../../nodejs/starter/StartProd').default


describe.only 'nodejs.StartProd', ->
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

    @newInstance = (argMachine, argWorkDir) =>
      startProd = new StartProd(@configPath, false, argMachine, @argHostName, argWorkDir)

      startProd.props = @fakeProps
      startProd.os = {
        mkdirP: sinon.stub().returns(Promise.resolve())
        symlink: sinon.stub().returns(Promise.resolve())
      }
      startProd._envBuilder = {
        collect: sinon.stub().returns(Promise.resolve())
        writeEnv: sinon.stub().returns(Promise.resolve())
        configManager: {
          dependencies: {dep: '1.2.3'}
        }
      }
      startProd.prodBuild = {
        buildInitialSystem: sinon.stub().returns(Promise.resolve())
        buildIos: sinon.stub().returns(Promise.resolve())
        buildPackageJson: sinon.stub().returns(Promise.resolve())
      }
      startProd.installNpmModules = sinon.stub().returns(Promise.resolve())
      startProd.startSystem = sinon.stub().returns(Promise.resolve())

      return startProd

  it 'init - init groupConfig, props and make envBuilder instance', ->
    startProd = new StartProd(@configPath, false, @x86Machine, @argHostName, argWorkDir)

    startProd.groupConfig.init = sinon.stub().returns(Promise.resolve());
    startProd.groupConfig.getHostConfig = () => @hostConfog

    await startProd.init()

    sinon.assert.calledOnce(startProd.groupConfig.init)
    assert.deepEqual(startProd._envBuilder.configManager.hostConfigOrConfigPath, @hostConfog)
    assert.equal(startProd._envBuilder.buildDir, startProd.props.envSetDir)
    assert.equal(startProd._envBuilder.tmpBuildDir, "#{startProd.props.tmpDir}/envSet")

  it 'start', ->
    SystemClass = class Sys
    startProd = @newInstance(@x86Machine, @workDir)

    startProd.installModules = sinon.stub().returns(Promise.resolve())
    startProd.requireSystemClass = sinon.stub().returns(SystemClass)

    await startProd.start()

    sinon.assert.calledOnce(startProd.envBuilder.collect)
    sinon.assert.calledOnce(startProd.os.mkdirP)
    sinon.assert.calledWith(startProd.os.mkdirP, @fakeProps.varDataDir)
    sinon.assert.calledOnce(startProd.installModules)
    sinon.assert.calledOnce(startProd.prodBuild.buildInitialSystem)
    sinon.assert.calledOnce(startProd.envBuilder.writeEnv)
    sinon.assert.calledOnce(startProd.prodBuild.buildIos)
    sinon.assert.calledOnce(startProd.requireSystemClass)
    sinon.assert.calledWith(startProd.requireSystemClass, 'envSetDir/system/System')
    sinon.assert.calledOnce(startProd.startSystem)
    sinon.assert.calledWith(startProd.startSystem, SystemClass)

  it 'installModules - not force and node_modules exists - do nothing', ->
    startProd = @newInstance(@x86Machine, @workDir)

    startProd.os.exists = () => true

    sinon.assert.notCalled(startProd.prodBuild.buildPackageJson)

  it 'installModules - not force and node_modules doesnt exist', ->
    startProd = @newInstance(@x86Machine, @workDir)

    startProd.os.exists = () => false

    sinon.assert.calledOnce(startProd.prodBuild.buildPackageJson)
    sinon.assert.calledWith(startProd.prodBuild.buildPackageJson, {dep: '1.2.3'})
    sinon.assert.calledOnce(startProd.installNpmModules)
    sinon.assert.calledOnce(startProd.os.symlink)
    sinon.assert.calledWith(startProd.os.symlink, '', '')

  it 'installModules - force', ->
    startProd = @newInstance(@x86Machine, @workDir)

    startProd.props.force = true
    startProd.os.exists = () => true

    sinon.assert.calledOnce(startProd.prodBuild.buildPackageJson)
    sinon.assert.calledOnce(startProd.installNpmModules)
    sinon.assert.calledOnce(startProd.os.symlink)
    sinon.assert.calledWith(startProd.os.symlink, '', '')


# TODO: test force
# TODO: test resolving a machine
