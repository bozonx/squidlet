collections = require('../../../system/helpers/collections')


describe.only 'system.helpers.collections', ->
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
    assert.deepEqual(collections.getDifferentKeys(undefined, {a:1, b:2}), ['a', 'b'])
    assert.deepEqual(collections.getDifferentKeys({a:1, b:1, c:1}, undefined), [])

  it 'mergeDeep', ->
    top = {top: 'top', nested: {nestedTop: 'top'}}
    bottom = {top: 'bottom', bottom: 'bottom', nested: {nestedTop: 'bottom', nestedBottom: 'bottom'}}
    result = {top: 'top', bottom: 'bottom', nested: {nestedTop: 'top', nestedBottom: 'bottom'}}
    assert.deepEqual(collections.mergeDeep(top, bottom), result)
    # not mutated
    assert.deepEqual(top, {top: 'top', nested: {nestedTop: 'top'}})
    # set undefined obviously
    assert.deepEqual(
      collections.mergeDeep({top: undefined}, {top: 'top', bottom: 'bottom'}),
      {top: undefined, bottom: 'bottom'}
    )

  it 'removeItemFromArray', ->
    arr = ['a', 'b', 'c', 'b']

    assert.deepEqual(collections.removeItemFromArray(arr, 'b'), ['a', 'c', 'b'])
    assert.deepEqual(collections.removeItemFromArray(arr, 'b', false), ['a', 'c'])
