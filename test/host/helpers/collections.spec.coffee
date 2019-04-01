collections = require('../../../host/helpers/collections')


describe.only 'helpers.collections', ->
  it 'withoutFirstItemUint8Arr', ->
    uint = new Uint8Array(2)
    uint[0] = 127
    uint[1] = 255
    resultUint = new Uint8Array(1)
    resultUint[0] = 255
    assert.deepEqual(collections.withoutFirstItemUint8Arr(uint), resultUint)

  it 'addFirstItemUint8Arr', ->
    uint = new Uint8Array(1)
    uint[0] = 255
    resultUint = new Uint8Array(2)
    resultUint[0] = 127
    resultUint[1] = 255
    assert.deepEqual(collections.addFirstItemUint8Arr(uint, 127), resultUint)

  it 'isUint8Array', ->
    uint = new Uint8Array(1)
    assert.isTrue(collections.isUint8Array(uint))
    assert.isFalse(collections.isUint8Array([]))
