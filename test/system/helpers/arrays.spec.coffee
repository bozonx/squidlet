arrays = require('../../../system/lib/arrays')


describe.only 'system.helpers.arrays', ->
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
