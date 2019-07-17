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

    @newInstance = (argMachine, argWorkDir, argForce = false) =>
      new StartProd(@configPath, argForce, argMachine, @argHostName, argWorkDir)

  it 'init - init groupConfig, props and make envBuilder instance', ->
    startProd = @newInstance(@x86Machine, @workDir)

    startProd.groupConfig.init = sinon.stub().returns(Promise.resolve());
    startProd.groupConfig.getHostConfig = () => @hostConfog

    await startProd.init()

    sinon.assert.calledOnce(startProd.groupConfig.init)
    assert.deepEqual(startProd._envBuilder.configManager.hostConfigOrConfigPath, @hostConfog)
    assert.equal(startProd._envBuilder.buildDir, startProd.props.envSetDir)
    assert.equal(startProd._envBuilder.tmpBuildDir, "#{startProd.props.tmpDir}/envSet")

# TODO: test force
# TODO: test resolving a machine
