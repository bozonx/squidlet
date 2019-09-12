lodashLike = require('../../../system/lib/lodashLike')


describe 'system.lib.lodashLike', ->
#  it 'values', ->
#    assert.deepEqual(lodashLike.values({a: 0, b: 1}), [0, 1])



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
