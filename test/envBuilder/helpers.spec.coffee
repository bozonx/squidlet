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

  it 'convertDefinitions', ->

  it 'collectServicesFromShortcuts', ->

  it 'checkDevs', ->
