arrays = require('../../../system/lib/arrays')


describe 'system.lib.arrays', ->
  it 'lastItem', ->
    assert.equal(arrays.lastItem([0,1,2]), 2)

  it 'arraysDifference', ->
    assert.deepEqual(arrays.arraysDifference([1,4], [1,2,3]), [4])
    assert.deepEqual(arrays.arraysDifference([1,3], [1,2,3]), [])
    assert.deepEqual(arrays.arraysDifference([], [1,2,3]), [])
    assert.deepEqual(arrays.arraysDifference([1,4], []), [1,4])

  it 'compactUndefined', ->
    assert.deepEqual(arrays.compactUndefined([undefined, null, 0, 1, '', 'str']), [null, 0, 1, '', 'str'])

  it 'clearArray', ->
    arr = [0,1,2]
    arrays.clearArray(arr)
    assert.deepEqual(arr, [])

  it 'makeSizedArray', ->
    assert.deepEqual(arrays.makeSizedArray([0,1], 2), [0,1]);
    assert.deepEqual(arrays.makeSizedArray([0], 2), [0, undefined]);
    assert.deepEqual(arrays.makeSizedArray([0, 1, 2], 2), [0, 1]);

  it 'removeItemFromArray', ->
    arr = ['a', 'b', 'c', 'b']

    assert.deepEqual(arrays.removeItemFromArray(arr, 'b'), ['a', 'c', 'b'])
    assert.deepEqual(arrays.removeItemFromArray(arr, 'b', false), ['a', 'c'])

  it 'concatUniqStrArrays', ->
    assert.deepEqual(arrays.concatUniqStrArrays(['a', 'b'], ['b', 'c']), ['a', 'b', 'c'])

  it 'cloneDeepArray', ->
    assert.deepEqual(arrays.cloneDeepArray(), [])
    assert.deepEqual(arrays.cloneDeepArray([undefined]), [undefined])

    arr1 = ['a']
    assert.deepEqual(arrays.cloneDeepArray(arr1), ['a'])
    assert.isFalse(arrays.cloneDeepArray(arr1) == arr1)

    obj = {a:1}
    arr2 = [obj]
    assert.deepEqual(arrays.cloneDeepArray(arr2), [{a:1}])
    assert.isFalse(arrays.cloneDeepArray(arr2)[0] == obj)

#  it 'compactArray', ->
#    assert.deepEqual(arrays.compactArray([undefined, null, 0, 1, '', 'str']), [0, 1, 'str'])

#  it 'findIndexArray', ->
#    assert.equal(arrays.findIndexArray(['a', 'b'], (item) => item == 'b'), 1)
#    assert.equal(arrays.findIndexArray(['a', 'b'], (item) => item == 'c'), -1)
#    assert.equal(arrays.findIndexArray(undefined, (item) => item == 'c'), -1)
