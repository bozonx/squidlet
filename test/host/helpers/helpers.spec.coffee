helpers = require('../../../host/helpers/helpers')


describe 'helpers.helpers', ->
  it 'isUint8Array', ->
    uint = new Uint8Array(1)
    assert.isTrue(helpers.isUint8Array(uint))
    assert.isFalse(helpers.isUint8Array([]))
