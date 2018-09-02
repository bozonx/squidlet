Register = require('../../master/Register').default


describe.only 'master.Register', ->
  beforeEach ->
    @plugin = sinon.spy()
    @entity = {
      name: 'EntityName'
      baseDir: 'myDir'
      main: './mainFile.ts'
    }
    @main = {}
    @register = new Register(@main)

  it 'addPlugin as function and init', ->
    @register.addPlugin(@plugin)
    pluginEnv = { env: 1 }

    assert.deepEqual(@register.plugins, [@plugin])

    @register.initPlugins(pluginEnv)

    sinon.assert.calledWith(@plugin, pluginEnv)

  it 'addPlugin as a path', ->
    @main.$require = () => @plugin
    @register.addPlugin('/path/to/plugin')

    assert.deepEqual(@register.plugins, [@plugin])

  it 'addDevice, addDriver, addService as an object', ->
    await @register.addDevice(@entity)
    await @register.addDriver(@entity)
    await @register.addService(@entity)

    assert.equal(@register.registeringPromises.length, 3)
    assert.deepEqual(@register.getDevicesPreManifests(), [ @entity ])
    assert.deepEqual(@register.getDriversPreManifests(), [ @entity ])
    assert.deepEqual(@register.getServicesPreManifests(), [ @entity ])

  it 'addDevice, addDriver, addService as a path', ->
    @main.$loadManifest = () => @entity
    pathTo = '/path/to/entity'

    await @register.addDevice(pathTo)
    await @register.addDriver(pathTo)
    await @register.addService(pathTo)

    assert.equal(@register.registeringPromises.length, 3)
    assert.deepEqual(@register.getDevicesPreManifests(), [ @entity ])
    assert.deepEqual(@register.getDriversPreManifests(), [ @entity ])
    assert.deepEqual(@register.getServicesPreManifests(), [ @entity ])


# TODO: тестировать что уже зарегистрирован
