lodashLike = require('../../../system/helpers/lodashLike')


describe 'system.helpers.lodashLike', ->
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

  it 'isEqual', ->
    assert.isTrue(lodashLike.isEqual(1, 1))
    assert.isFalse(lodashLike.isEqual(1, 0))
    assert.isTrue(lodashLike.isEqual('a', 'a'))
    assert.isFalse(lodashLike.isEqual('a', 'b'))
    assert.isTrue(lodashLike.isEqual(null, null))
    assert.isFalse(lodashLike.isEqual(null, undefined))
    assert.isTrue(lodashLike.isEqual(undefined, undefined))
    assert.isFalse(lodashLike.isEqual(undefined, null))
    fn = () =>
    assert.isTrue(lodashLike.isEqual(fn, fn))
    assert.isFalse(lodashLike.isEqual(fn, () =>))
    assert.isTrue(lodashLike.isEqual(['a'], ['a']))
    assert.isFalse(lodashLike.isEqual(['a'], ['a', 'b']))
    assert.isTrue(lodashLike.isEqual({a: {aa: 1}}, {a: {aa: 1}}))
    assert.isFalse(lodashLike.isEqual({a: {aa: 1}}, {a: {aa: 1, bb: 2}}))
    assert.isFalse(lodashLike.isEqual({a: 1}, ['a']))
    uint1 = new Uint8Array(1)
    uint2 = new Uint8Array(1)
    uint1[0] = 255
    uint2[0] = 255
    assert.isTrue(lodashLike.isEqual(uint1, uint2))
    assert.isFalse(lodashLike.isEqual(uint1, new Uint8Array(1)))
    assert.isFalse(lodashLike.isEqual(uint1, []))

  it 'isObject', ->
    cl = () ->
    assert.isTrue(lodashLike.isObject({}))
    assert.isTrue(lodashLike.isObject(new cl()))
    assert.isFalse(lodashLike.isObject([]))
    assert.isFalse(lodashLike.isObject(''))
    assert.isFalse(lodashLike.isObject(undefined))
    assert.isFalse(lodashLike.isObject(null))
    assert.isFalse(lodashLike.isObject(0))

  it 'isPlainObject', ->
    cl = () ->
    assert.isTrue(lodashLike.isPlainObject({}))
    assert.isFalse(lodashLike.isPlainObject(new cl()))
    assert.isFalse(lodashLike.isPlainObject([]))
    assert.isFalse(lodashLike.isPlainObject(''))
    assert.isFalse(lodashLike.isPlainObject(undefined))
    assert.isFalse(lodashLike.isPlainObject(null))
    assert.isFalse(lodashLike.isPlainObject(0))

  it 'difference', ->
    assert.deepEqual(lodashLike.difference([1,4], [1,2,3]), [4])
    assert.deepEqual(lodashLike.difference([1,3], [1,2,3]), [])
    assert.deepEqual(lodashLike.difference([], [1,2,3]), [])
    assert.deepEqual(lodashLike.difference([1,4], []), [1,4])

#  it 'defaultsDeep', ->
#    mutated = {}
#    top = {top: 'top'}
#    mid = {top: 'mid', mid: 'mid'}
#    bottom = {top: 'bottom', mid: 'bottom', bottom: 'bottom'}
#    result = {top: 'top', mid: 'mid', bottom: 'bottom'}
#    assert.deepEqual( lodashLike.defaultsDeep(mutated, top, mid, bottom), result )
#    # top wasn't mutated
#    assert.deepEqual(top, {top: 'top'})
#    # mutated
#    assert.deepEqual(mutated, result)
#    # simple mutated
#    assert.deepEqual( lodashLike.defaultsDeep({top: 'top'}, mid), {top: 'top', mid: 'mid'} )
