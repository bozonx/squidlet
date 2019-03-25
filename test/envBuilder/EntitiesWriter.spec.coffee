EntitiesWriter = require('../../hostEnvBuilder/entities/EntitiesWriter').default


describe 'envBuilder.EntitiesWriter', ->
  beforeEach ->
    @entitiesNames = {
      devices: ['MyDevice']
      drivers: ['MyDriver']
      services: ['MyService']
    }

    @entitiesSet = {
      devices: {
        MyDevice: {
          srcDir: '/srcDir'
          manifest: {
            name: 'MyDevice'
            main: 'main.ts'
            props: {
              manifestProp: 1
            }
          }
          files: ['subDir/someFile.json']
          system: false
        }
      }
      drivers: {
        MyDriver: {
          srcDir: '/srcDir'
          manifest: {
            name: 'MyDriver'
            main: 'main.ts'
            props: {
              manifestProp: 1
            }
          }
          files: []
          system: true
        }
      }
      services: {
        MyService: {
          srcDir: '/srcDir'
          manifest: {
            name: 'MyService'
            main: 'main.ts'
            props: {
              manifestProp: 1
            }
          }
          files: []
          system: false
        }
      }
    }

    @io = {
      writeJson: sinon.spy()
      mkdirP: sinon.spy()
      copyFile: sinon.spy()
      rimraf: sinon.spy()
    }

    @logger = {
      info: () =>
    }

    @configManager = {
      buildDir: '/path/to/buildDir'
      tmpBuildDir: '/path/to/tmpBuildDir'
    }

    @usedEntities = {
      getEntitiesNames: () => @entitiesNames
      getEntitySet: (type, name) => @entitiesSet[type][name]
    }

    @entitiesWriter = new EntitiesWriter(@io, @logger, @configManager, @usedEntities)

    @entitiesWriter.buildEntity = sinon.spy()

  it 'writeUsed', ->
    await @entitiesWriter.writeUsed()

    sinon.assert.calledWith(@io.rimraf, "#{@configManager.tmpBuildDir}/**/*")

    #### Devices
    sinon.assert.calledWith(@io.writeJson.getCall(0),
      "#{@configManager.buildDir}/entities/devices/MyDevice/manifest.json",
      @entitiesSet.devices.MyDevice.manifest
    )
    sinon.assert.calledWith(@entitiesWriter.buildEntity.getCall(0),
      'devices',
      'MyDevice'
      '/srcDir',
      "#{@configManager.buildDir}/entities/devices/MyDevice"
    )
    sinon.assert.calledWith(@io.mkdirP, "#{@configManager.buildDir}/entities/devices/MyDevice/subDir")
    sinon.assert.calledWith(@io.copyFile, '/srcDir/subDir/someFile.json', "#{@configManager.buildDir}/entities/devices/MyDevice/subDir/someFile.json")

    #### Drivers
    sinon.assert.calledWith(@io.writeJson.getCall(1),
      "#{@configManager.buildDir}/entities/drivers/MyDriver/manifest.json",
      @entitiesSet.drivers.MyDriver.manifest
    )
    sinon.assert.calledWith(@entitiesWriter.buildEntity.getCall(1),
      'drivers',
      'MyDriver'
      '/srcDir',
      "#{@configManager.buildDir}/entities/drivers/MyDriver"
    )

    #### Services
    sinon.assert.calledWith(@io.writeJson.getCall(2),
      "#{@configManager.buildDir}/entities/services/MyService/manifest.json",
      @entitiesSet.services.MyService.manifest
    )
    sinon.assert.calledWith(@entitiesWriter.buildEntity.getCall(2),
      'services',
      'MyService'
      '/srcDir',
      "#{@configManager.buildDir}/entities/services/MyService"
    )
