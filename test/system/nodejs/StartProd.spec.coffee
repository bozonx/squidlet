StartProd = require('../../../nodejs/starter/StartProd').default


describe.only 'nodejs.StartProd', ->
  beforeEach ->
    @configPath = 'path/to/config'
    @argHostName = 'testHost'
    @x86Machine = 'x86'
    @workDir = 'testHost'

    @newInstance = (argForce = false, argMachine, argWorkDir) =>
      new StartProd(@configPath, argForce, argMachine, @argHostName, argWorkDir)

  it 'init', ->


# TODO: test force
# TODO: test resolving a machine
