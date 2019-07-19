Props = require('../../../nodejs/starter/Props').default


describe.only 'nodejs.Props', ->
  beforeEach ->
    @os = {}
    @groupConfig = {}
    @argMachine = 'x86'
    @argHostName = 'myhost'
    @argWorkDir = 'workdir'
    @props = new Props(@os, @groupConfig, true, @argMachine, @argHostName, @argWorkDir)

  it 'resolve', ->
