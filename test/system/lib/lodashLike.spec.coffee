lodashLike = require('../../../system/lib/lodashLike')


describe.only 'system.lib.lodashLike', ->
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

  it 'trimStart', ->
    assert.equal(lodashLike.trimStart('  a  '), 'a  ')

  it 'trimEnd', ->
    assert.equal(lodashLike.trimEnd('  a  '), '  a')

  it 'trim', ->
    assert.equal(lodashLike.trim('  a  '), 'a')

  it 'padStart', ->
    assert.equal(lodashLike.padStart('11', 8, '0'), '00000011')

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



#  it 'cloneDeep', ->
#    obj = {a: 1}
#    assert.isFalse(lodashLike.cloneDeep(obj) == obj)
#    assert.deepEqual(lodashLike.cloneDeep(obj), obj)
#    arr = ['a']
#    assert.isFalse(lodashLike.cloneDeep(arr) == arr)
#    assert.deepEqual(lodashLike.cloneDeep(arr), arr)
#    uint = new Uint8Array(1)
#    uint[0] = 255
#    assert.isFalse(lodashLike.cloneDeep(uint) == uint)
#    assert.deepEqual(lodashLike.cloneDeep(uint), uint)



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
