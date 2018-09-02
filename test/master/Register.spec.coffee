Register = require('../../master/Register').default


describe.only 'master.Register', ->
  beforeEach ->
    @plugin = sinon.spy()
    @main = {
      $require: () => @plugin
    }
    @register = new Register(@main)

  it 'addPlugin as function and init', ->

    @register.addPlugin(@plugin)
    pluginEnv = { env: 1 }

    assert.deepEqual(@register.plugins, [@plugin])

    @register.initPlugins(pluginEnv)

    sinon.assert.calledWith(@plugin, pluginEnv)

  it 'addPlugin as a path', ->
    @register.addPlugin('/path/to/plugin')

    assert.deepEqual(@register.plugins, [@plugin])
