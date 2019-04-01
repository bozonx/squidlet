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

#  it 'find', ->
#    cb = (item, index) => item == 1
#    assert.deepEqual(lodashLike.find({a: 0, b: 1}, cb), 1)
#    # TODO: test array
