normalize = require('../../hostEnvBuilder/hostConfig/normalizeHostConfig')


describe 'envBuilder.normalizeHostConfig', ->
  beforeEach ->

  it 'makeDevicesPlain', ->
    preDevices = {
      room: {
        device1: {
          device: 'MyDevice'
        }
      }
    }
    assert.deepEqual(normalize.makeDevicesPlain(preDevices), {
      'room.device1': {
        device: 'MyDevice'
      },
    })

  it 'convertDefinitions', ->
    preDefinitions = {
      'room.device1': {
        device: 'MyDevice'
        param: 1
      }
    }
    assert.deepEqual(normalize.convertDefinitions('device', preDefinitions), {
      'room.device1': {
        className: 'MyDevice'
        param: 1
      },
    })

  it 'collectServicesFromShortcuts', ->
    preHostConfig = {
      mqtt: {
        param: 1
      }
    }

    servicesShortcut = {
      mqtt: 'Mqtt'
    }

    assert.deepEqual(normalize.collectServicesFromShortcuts(preHostConfig, servicesShortcut), {
      mqtt: {
        className: 'Mqtt'
        param: 1
      }
    })
