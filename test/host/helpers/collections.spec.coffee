collections = require('../../../host/helpers/collections')


describe.only 'helpers.collections', ->
  it 'isUint8Array', ->
    uint = new Uint8Array(1)
    assert.isTrue(collections.isUint8Array(uint))
    assert.isFalse(collections.isUint8Array([]))
