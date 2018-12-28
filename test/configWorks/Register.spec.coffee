Register = require('../../squidlet-starter/buildHostEnv/Register').default


describe 'configWorks.Register', ->
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
    @register.require = () => @plugin
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
    @register.loadManifest = () => @entity
    pathTo = '/path/to/entity'

    await @register.addDevice(pathTo)
    await @register.addDriver(pathTo)
    await @register.addService(pathTo)

    assert.equal(@register.registeringPromises.length, 3)
    assert.deepEqual(@register.getDevicesPreManifests(), [ @entity ])
    assert.deepEqual(@register.getDriversPreManifests(), [ @entity ])
    assert.deepEqual(@register.getServicesPreManifests(), [ @entity ])

  it "don't add double", ->
    await @register.addDevice(@entity)
    assert.isRejected(@register.addDevice(@entity))
