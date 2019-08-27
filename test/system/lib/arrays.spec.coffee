arrays = require('../../../system/lib/arrays')


describe 'system.lib.arrays', ->
  it 'lastItem', ->
    assert.equal(arrays.lastItem([0,1,2]), 2)

  it 'arraysDifference', ->
    assert.deepEqual(arrays.arraysDifference([1,4], [1,2,3]), [4])
    assert.deepEqual(arrays.arraysDifference([1,3], [1,2,3]), [])
    assert.deepEqual(arrays.arraysDifference([], [1,2,3]), [])
    assert.deepEqual(arrays.arraysDifference([1,4], []), [1,4])

  it 'compactArray', ->
    assert.deepEqual(arrays.compactArray([undefined, null, 0, 1, '', 'str']), [0, 1, 'str'])

  it 'compactUndefined', ->
    assert.deepEqual(arrays.compactUndefined([undefined, null, 0, 1, '', 'str']), [null, 0, 1, '', 'str'])

  it 'appendArray', ->
    arr = [1]
    arrays.appendArray(arr, [2])
    assert.deepEqual(arr, [1,2])

  it 'updateArray', ->
    arr = [0,1,2]
    arrays.updateArray(arr, ['a', 'b'])
    assert.deepEqual(arr, ['a', 'b', 2])
    # overflow
    arr = [0]
    arrays.updateArray(arr, [1,2])
    assert.deepEqual(arr, [1,2])
    # skip empty
    arr = [0,1,2]
    arr2 = []
    arr2[2] = 5
    arrays.updateArray(arr, arr2)
    assert.deepEqual(arr, [0,1,5])

  it 'setArrayDimension', ->
    assert.deepEqual(arrays.setArrayDimension([0,1], 2), [0,1]);
    assert.deepEqual(arrays.setArrayDimension([0], 2), [0, undefined]);
    assert.deepEqual(arrays.setArrayDimension([0, 1, 2], 2), [0, 1]);

  it 'removeItemFromArray', ->
    arr = ['a', 'b', 'c', 'b']

    assert.deepEqual(arrays.removeItemFromArray(arr, 'b'), ['a', 'c', 'b'])
    assert.deepEqual(arrays.removeItemFromArray(arr, 'b', false), ['a', 'c'])

  it 'concatUniqStrArrays', ->
    assert.deepEqual(arrays.concatUniqStrArrays(['a', 'b'], ['b', 'c']), ['a', 'b', 'c'])

  it 'findIndexArray', ->
    assert.equal(arrays.findIndexArray(['a', 'b'], (item) => item == 'b'), 1)
    assert.equal(arrays.findIndexArray(['a', 'b'], (item) => item == 'c'), -1)
    assert.equal(arrays.findIndexArray(undefined, (item) => item == 'c'), -1)
