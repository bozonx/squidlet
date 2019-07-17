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
