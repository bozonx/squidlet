#StartDevelop = require('../../nodejs/starters/StartDevelop').default
#
#
#describe 'nodejs.StartDevelop', ->
#  beforeEach ->
#    @configPath = 'path/to/config'
#    @argHostName = 'testHost'
#    @x86Machine = 'x86'
#    @workDir = 'testHost'
#    @hostConfog = {
#      id: @argHostName
#      platform: 'nodejs'
#    }
#    @fakeProps = {
#      workDir: @workDir
#      envSetDir: 'envSetDir'
#      varDataDir: 'varDataDir'
#      tmpDir: 'tmoDir'
#      platform: 'nodejs'
#      hostId: @argHostName
#      #force: false
#      hostConfig: @hostConfog
#    }
#    @argIoset = 'localhost:8080'
#
#    @newInstance = (argIoset) =>
#      startDevelop = new StartDevelop(@configPath, false, @x86Machine, @argHostName, @workDir, argIoset)
#
#      startDevelop.props = @fakeProps
#      startDevelop.os = {
#        mkdirP: sinon.stub().returns(Promise.resolve())
#      }
#      startDevelop._envBuilder = {
#        collect: sinon.stub().returns(Promise.resolve())
#        configManager: {
#          dependencies: {dep: '1.2.3'}
#        }
#      }
#      startDevelop.systemStarter = {
#        start: sinon.stub().returns(Promise.resolve())
#      }
#      startDevelop.installNpmModules = sinon.stub().returns(Promise.resolve())
#
#      return startDevelop
#
#  it 'init - init groupConfig, props and make envBuilder instance', ->
#    startDevelop = new StartDevelop(@configPath, false, @x86Machine, @argHostName, @workDir)
#
#    startDevelop.groupConfig.init = sinon.stub().returns(Promise.resolve());
#    startDevelop.groupConfig.getHostConfig = () => @hostConfog
#
#    await startDevelop.init()
#
#    sinon.assert.calledOnce(startDevelop.groupConfig.init)
#    assert.deepEqual(startDevelop._envBuilder.configManager.hostConfigOrConfigPath, @hostConfog)
#    assert.equal(startDevelop._envBuilder.buildDir, startDevelop.props.envSetDir)
#    assert.equal(startDevelop._envBuilder.tmpBuildDir, "#{startDevelop.props.tmpDir}/envSet")
#
#  it 'start', ->
#    ioSet = { init: () -> }
#    pathToSystemFile = 'path/to/System'
#    startDevelop = @newInstance()
#
#    startDevelop.installModules = sinon.stub().returns(Promise.resolve())
#    startDevelop.getPathToProdSystemFile = sinon.stub().returns(pathToSystemFile)
#    startDevelop.makeIoSet = sinon.stub().returns(ioSet)
#
#    await startDevelop.start()
#
#    sinon.assert.calledOnce(startDevelop.envBuilder.collect)
#    sinon.assert.calledTwice(startDevelop.os.mkdirP)
#    sinon.assert.calledWith(startDevelop.os.mkdirP.getCall(0), @fakeProps.varDataDir)
#    sinon.assert.calledWith(startDevelop.os.mkdirP.getCall(1), @fakeProps.envSetDir)
#    sinon.assert.calledOnce(startDevelop.installModules)
#    sinon.assert.calledOnce(startDevelop.systemStarter.start)
#    sinon.assert.calledWith(startDevelop.systemStarter.start, 'path/to/System', ioSet)
#
#  it 'makeIoSet', ->
#    startDevelop = @newInstance(@argIoset)
#    constructorArgs = []
#    prepareStub = sinon.stub().returns(Promise.resolve())
#    class IoSetClass
#      constructor: (args...) ->
#        constructorArgs = args
#      prepare: prepareStub
#
#    startDevelop.os.require = sinon.stub().returns({default: IoSetClass})
#
#    result = await startDevelop.makeIoSet()
#
#    assert.isTrue(result instanceof IoSetClass)
#    sinon.assert.calledOnce(prepareStub)
#    sinon.assert.calledWith(startDevelop.os.require, './IoSetDevelopRemote')
#    assert.equal(constructorArgs[0], startDevelop.os)
#    assert.equal(constructorArgs[1], startDevelop.envBuilder)
#    assert.equal(constructorArgs[2], startDevelop.props.envSetDir)
#    assert.equal(constructorArgs[3], startDevelop.props.platform)
#    assert.equal(constructorArgs[4], startDevelop.props.machine)
#    assert.equal(constructorArgs[5], @argIoset)
#
#  it 'resolveIoSetType - with --ioset arg', ->
#    startDevelop = @newInstance(@argIoset)
#
#    assert.equal(startDevelop.resolveIoSetType(), 'IoSetDevelopRemote')
#
#  it 'resolveIoSetType - no arg --ioset', ->
#    startDevelop = @newInstance()
#
#    assert.equal(startDevelop.resolveIoSetType(), 'IoSetDevelopSrc')
#
#
##  it 'installModules - not force and node_modules exists - do nothing', ->
##    startDevelop = @newInstance()
##
##  it 'installModules - not force and node_modules doesnt exist', ->
##    startDevelop = @newInstance()
##
##  it 'installModules - force', ->
##    startDevelop = @newInstance()
