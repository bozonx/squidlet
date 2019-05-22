Register = require('../../hostEnvBuilder/entities/Register').default


describe 'envBuilder.Register', ->
  beforeEach ->
    @plugin = sinon.spy()
    @entity = {
      name: 'EntityName'
      #baseDir: 'myDir'
      main: 'mainFile.ts'
    }
    @deviceEntity = {
      @entity...
      type: 'some'
    }
    @os = {}
    @register = new Register(@os)

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
    await @register.addDevice({ @deviceEntity..., baseDir: 'some' })
    await @register.addDriver({ @entity..., baseDir: 'some' })
    await @register.addService({ @entity..., baseDir: 'some' })

    assert.equal(@register.registeringPromises.length, 3)
    assert.deepEqual(@register.getEntityManifest('devices', 'EntityName'), {@deviceEntity..., baseDir: 'some' })
    assert.deepEqual(@register.getEntityManifest('drivers', 'EntityName'), {@entity..., baseDir: 'some' })
    assert.deepEqual(@register.getEntityManifest('services', 'EntityName'), {@entity..., baseDir: 'some' })

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
    await @register.addDriver({ @entity..., baseDir: 'some' })
    assert.isRejected(@register.addDriver({ @entity..., baseDir: 'some' }))

  it "resolveManifest - load from file", ->
    @os.exists = () => Promise.resolve(true)
    @os.stat = () => Promise.resolve({dir: true})
    @os.loadYamlFile = sinon.stub().returns(Promise.resolve(@entity))

    result = await @register.resolveManifest('/path/to/entity')

    assert.deepEqual(result, @entity)
    sinon.assert.calledWith(@os.loadYamlFile, '/path/to/entity/manifest.yaml')

  it "resolveManifest - load props from file", ->
    @os.exists = () => Promise.resolve(true)
    @os.stat = () => Promise.resolve({dir: true})
    @os.loadYamlFile = sinon.stub().returns(Promise.resolve({
      param: 1
    }))

    result = await @register.resolveManifest({
      name: 'EntityName'
      baseDir: '/myDir'
      main: './mainFile.ts'
      files: ['./file.json']
      props: './props.yaml'
    })

    assert.deepEqual(result, {
      name: 'EntityName'
      baseDir: '/myDir'
      main: 'mainFile.ts'
      files: ['file.json']
      props: {
        param: 1
      }
    })
    sinon.assert.calledWith(@os.loadYamlFile, '/myDir/props.yaml')
