HostsConfigsSet = require('../../master/HostsConfigsSet').default


describe.only 'master.HostsConfigsSet', ->
  beforeEach ->
    @main = {
    }
    @hostsConfigsSet = new HostsConfigsSet(@main)

  it 'generate', ->
