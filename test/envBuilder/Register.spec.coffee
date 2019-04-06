Register = require('../../hostEnvBuilder/entities/Register').default


describe.only 'envBuilder.Register', ->
  beforeEach ->
    @plugin = sinon.spy()
    @entity = {
      name: 'EntityName'
      # TODO: why???
      baseDir: 'myDir'
      main: './mainFile.ts'
    }
    @deviceEntity = {
      @entity...
      type: 'some'
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
    await @register.addDevice(@deviceEntity)
    await @register.addDriver(@entity)
    await @register.addService(@entity)

    assert.equal(@register.registeringPromises.length, 3)
    assert.deepEqual(@register.getEntityManifest('devices', 'EntityName'), @deviceEntity)
    assert.deepEqual(@register.getEntityManifest('drivers', 'EntityName'), @entity)
    assert.deepEqual(@register.getEntityManifest('services', 'EntityName'), @entity)

  it 'addDevice, addDriver, addService as a path', ->
    @register.loadManifest = () => @deviceEntity
    pathTo = '/path/to/entity'

    await @register.addDevice(pathTo)
    await @register.addDriver(pathTo)
    await @register.addService(pathTo)

    assert.equal(@register.registeringPromises.length, 3)
    assert.deepEqual(@register.getEntityManifest('devices', 'EntityName'), @deviceEntity)
    assert.deepEqual(@register.getEntityManifest('drivers', 'EntityName'), @deviceEntity)
    assert.deepEqual(@register.getEntityManifest('services', 'EntityName'), @deviceEntity)

  it "don't add double", ->
    await @register.addDriver(@entity)
    assert.isRejected(@register.addDriver(@entity))

  it "resolveManifest - load from file", ->
    @register.io.exists = () => Promise.resolve(true)
    @register.io.stat = () => Promise.resolve({dir: true})
    @register.io.loadYamlFile = sinon.stub().returns(Promise.resolve(@entity))

    result = await @register.resolveManifest('/path/to/entity')

    assert.deepEqual(result, @entity)
    sinon.assert.calledWith(@register.io.loadYamlFile, '/path/to/entity/manifest.yaml')

  it "resolveManifest - load props from file", ->
    @register.io.exists = () => Promise.resolve(true)
    @register.io.stat = () => Promise.resolve({dir: true})
    @register.io.loadYamlFile = sinon.stub().returns(Promise.resolve({
      param: 1
    }))

    result = await @register.resolveManifest({
      name: 'EntityName'
      baseDir: '/myDir'
      main: './mainFile.ts'
      props: './props.yaml'
    })

    assert.deepEqual(result, {
      name: 'EntityName'
      baseDir: '/myDir'
      main: './mainFile.ts'
      props: {
        param: 1
      }
    })
    sinon.assert.calledWith(@register.io.loadYamlFile, '/myDir/props.yaml')
