lodashLike = require('../../../host/helpers/lodashLike')


describe.only 'helpers.lodashLike', ->
  it 'isEmpty', ->
    assert.equal(lodashLike.isEmpty(undefined), true)
    assert.equal(lodashLike.isEmpty(null), true)
    assert.equal(lodashLike.isEmpty(''), true)
    assert.equal(lodashLike.isEmpty([]), true)
    assert.equal(lodashLike.isEmpty({}), true)
    assert.equal(lodashLike.isEmpty(0), false)
    assert.equal(lodashLike.isEmpty('a'), false)
    assert.equal(lodashLike.isEmpty([1]), false)
    assert.equal(lodashLike.isEmpty({a:1}), false)
    assert.equal(lodashLike.isEmpty(false), false)

  it 'values', ->
    assert.deepEqual(lodashLike.values({a: 0, b: 1}), [0, 1])

  it 'omit', ->
    assert.deepEqual(lodashLike.omit({a: 0, b: 1, c: 2}, 'a', 'b'), {c: 2})

  it 'find', ->
    # object
    objCb = (item, index) => item == 1
    assert.equal(lodashLike.find({a: 0, b: 1}, objCb), 1)
    # object - not found
    assert.isUndefined(lodashLike.find({a: 0, b: 2}, objCb))
    # array
    arrCb = (item, index) => item == 'b'
    assert.equal(lodashLike.find(['a', 'b'], arrCb), 'b')
    # array - not found
    assert.isUndefined(lodashLike.find(['a', 'c'], arrCb))

  it 'trimStart', ->
    assert.equal(lodashLike.trimStart('  a  '), 'a  ')

  it 'trimEnd', ->
    assert.equal(lodashLike.trimEnd('  a  '), '  a')

  it 'trim', ->
    assert.equal(lodashLike.trim('  a  '), 'a')

  it 'padStart', ->
    assert.equal(lodashLike.padStart('11', 8, '0'), '00000011')

  it 'last', ->
    assert.equal(lodashLike.last([0,1,2]), 2)

  it 'cloneDeep', ->
    obj = {a: 1}
    assert.isFalse(lodashLike.cloneDeep(obj) == obj)
    assert.deepEqual(lodashLike.cloneDeep(obj), obj)
    arr = ['a']
    assert.isFalse(lodashLike.cloneDeep(arr) == arr)
    assert.deepEqual(lodashLike.cloneDeep(arr), arr)
    uint = new Uint8Array(1)
    uint[0] = 255
    assert.isFalse(lodashLike.cloneDeep(uint) == uint)
    assert.deepEqual(lodashLike.cloneDeep(uint), uint)
