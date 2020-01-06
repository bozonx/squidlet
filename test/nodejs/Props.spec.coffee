#Props = require('../../__old/nodejs/Props').default
#
#
#describe 'nodejs.Props', ->
#  beforeEach ->
#    @os = {}
#    @hostConfig = { id: 'myhost', platform: 'nodejs' }
#    @groupConfig = {
#      getHostConfig: () => @hostConfig
#    }
#    @machine = 'x86'
#    @hostId = 'myhost'
#    @workDir = 'workdir'
#    @props = new Props(@os, @groupConfig, true, undefined, undefined, undefined)
#
#  it 'resolve', ->
#    @props.resolveMachine = () => Promise.resolve(@machine)
#    @props.resolveWorkDir = sinon.stub().returns(@workDir)
#
#    await @props.resolve()
#
#    sinon.assert.calledOnce(@props.resolveWorkDir)
#    sinon.assert.calledWith(@props.resolveWorkDir, 'workdirs/myhost')
#    assert.equal(@props.workDir, @workDir)
#    assert.equal(@props.envSetDir, 'workdir/envSet')
#    assert.equal(@props.varDataDir, 'workdir/varData')
#    assert.equal(@props.tmpDir, 'workdir/tmp')
#    assert.equal(@props.platform, 'nodejs')
#    assert.equal(@props.hostId, @hostId)
#    #assert.equal(@props.destroyTimeoutSec, 60)
#    #assert.isTrue(@props.force)
#    assert.equal(@props.hostConfig, @hostConfig)
#    assert.equal(@props.machine, @machine)
#
#  it 'validate - platform doesnt match hostConfig.platform', ->
#    @hostConfig.platform = 'other'
#
#    assert.throws(() => @props.validate())
#
#  it 'resolveMachine - have argMachine', ->
#    @props.argMachine = @machine
#    @props.getOsMachine = sinon.spy()
#
#    result = await @props.resolveMachine()
#
#    sinon.assert.notCalled(@props.getOsMachine)
#    assert.equal(result, @machine)
#
#  it 'resolveMachine - unsupported machine', ->
#    @props.argMachine = 'unsupported'
#
#    assert.isRejected(@props.resolveMachine())
#
#  it 'resolveMachine - not set arg machine', ->
#    @props.getOsMachine = sinon.stub().returns(Promise.resolve(@machine))
#
#    result = await @props.resolveMachine()
#
#    assert.equal(result, @machine)
