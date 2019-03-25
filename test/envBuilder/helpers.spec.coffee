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

  it 'collectServicesFromShortcuts', ->

  it 'checkDevs', ->
