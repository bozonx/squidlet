Props = require('../../../nodejs/starter/Props').default


describe.only 'nodejs.Props', ->
  beforeEach ->
    @os = {}
    @hostConfig = { id: 'myhost' }
    @groupConfig = {
      getHostConfig: () => @hostConfig
    }
    @machine = 'x86'
    @hostName = 'myhost'
    @workDir = 'workdir'
    @props = new Props(@os, @groupConfig, true, undefined, undefined, undefined)

  it 'resolve', ->
    @props.resolveMachine = sinon.stub().returns(Promise.resolve(@machine))
    @props.resolveWorkDir = sinon.stub().returns(Promise.resolve(@workDir))

    await @props.resolve()

