collections = require('../../../host/helpers/collections')


describe 'helpers.collections', ->
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

  it 'appendArray', ->
    arr = [1]
    collections.appendArray(arr, [2])
    assert.deepEqual(arr, [1,2])

  it 'updateArray', ->
    arr = [0,1,2]
    collections.updateArray(arr, ['a', 'b'])
    assert.deepEqual(arr, ['a', 'b', 2])
    # overflow
    arr = [0]
    collections.updateArray(arr, [1,2])
    assert.deepEqual(arr, [1,2])
    # skip empty
    arr = [0,1,2]
    arr2 = []
    arr2[2] = 5
    collections.updateArray(arr, arr2)
    assert.deepEqual(arr, [0,1,5])

  it 'setArrayDimension', ->
    assert.deepEqual(collections.setArrayDimension([0,1], 2), [0,1]);
    assert.deepEqual(collections.setArrayDimension([0], 2), [0, undefined]);
    assert.deepEqual(collections.setArrayDimension([0, 1, 2], 2), [0, 1]);

  it 'getKeyOfObject', ->
    assert.equal(collections.getKeyOfObject({a: 1, b: 2}, 2), 'b')
    assert.isUndefined(collections.getKeyOfObject({a: 1, b: 2}, 3))

  it 'getDifferentKeys', ->
    assert.deepEqual(collections.getDifferentKeys({a:1, b:1, c:1}, {a:1, b:2}), ['b'])
