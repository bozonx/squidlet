helpers = require('../../hostEnvBuilder/helpers')

describe 'envBuilder.helpers', ->
  beforeEach ->

  it 'sortByIncludeInList', ->
    assert.deepEqual(
      helpers.sortByIncludeInList(['three', 'one', 'four', 'two'], ['one', 'two']),
      [
        ['one', 'two'],
        ['three', 'four'],
      ]
    )
  it 'makeDevicesPlain', ->
    preDevices = {
      room: {
        device1: {
          device: 'MyDevice'
        }
      }
    }
    assert.deepEqual(helpers.makeDevicesPlain(preDevices), {
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
    assert.deepEqual(helpers.convertDefinitions('device', preDefinitions), {
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

    assert.deepEqual(helpers.collectServicesFromShortcuts(preHostConfig, servicesShortcut), {
      mqtt: {
        className: 'Mqtt'
        param: 1
      }
    })

  it 'checkDevsExistance', ->
    assert.doesNotThrow(() => helpers.checkDevsExistance(['one'], ['one']))
    assert.throws(() => helpers.checkDevsExistance(['one'], ['two']))
