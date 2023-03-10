common = require('../../../system/lib/common')


describe 'system.lib.common', ->
  it 'isEqual', ->
    assert.isTrue(common.isEqual(1, 1))
    assert.isFalse(common.isEqual(1, 0))
    assert.isTrue(common.isEqual('a', 'a'))
    assert.isFalse(common.isEqual('a', 'b'))
    assert.isTrue(common.isEqual(null, null))
    assert.isFalse(common.isEqual(null, undefined))
    assert.isTrue(common.isEqual(undefined, undefined))
    assert.isFalse(common.isEqual(undefined, null))
    #functions
    fn = () =>
    assert.isTrue(common.isEqual(fn, fn))
    assert.isFalse(common.isEqual(fn, () =>))
    # classes
    class cl1
      param: 1
    class cl2
      param: 2
    assert.isTrue(common.isEqual(cl1, cl1))
    assert.isFalse(common.isEqual(cl1, cl2))
    assert.isFalse(common.isEqual(cl1, cl2))
    # uint
    uint1 = new Uint8Array(1)
    uint2 = new Uint8Array(1)
    uint1[0] = 255
    uint2[0] = 255
    assert.isTrue(common.isEqual(uint1, uint2))
    assert.isFalse(common.isEqual(uint1, new Uint8Array(1)))
    assert.isFalse(common.isEqual(uint1, []))

    # arrays
    assert.isTrue(common.isEqual([], []))
    assert.isTrue(common.isEqual(['a'], ['a']))
    assert.isFalse(common.isEqual(['a'], ['a', 'b']))
    assert.isFalse(common.isEqual([], undefined ))
    assert.isFalse(common.isEqual(undefined, []))
    assert.isTrue(common.isEqual([undefined, null, 1], [undefined, null, 1]))
    assert.isFalse(common.isEqual([undefined, null, 1], [null, undefined, 1]))

    # objects
    assert.isTrue(common.isEqual({}, {}))
    assert.isTrue(common.isEqual({a: {aa: 1}}, {a: {aa: 1}}))
    assert.isFalse(common.isEqual({a: {aa: 1}}, {a: {aa: 1, bb: 2}}))
    assert.isFalse(common.isEqual({a: 1}, ['a']))
    assert.isFalse(common.isEqual({}, undefined ))
    assert.isFalse(common.isEqual(undefined, {}))
    # undefined hasn't to be converted to null
    assert.isTrue(common.isEqual({und: undefined, nl: null}, {und: undefined, nl: null}))
    assert.isFalse(common.isEqual({und: undefined, nl: undefined}, {und: undefined, nl: null}))
    assert.isTrue(common.isEqual({arr: [undefined, null]}, {arr: [undefined, null]}))

  it 'parseValue', ->
    assert.isUndefined(common.parseValue(undefined))
    assert.isUndefined(common.parseValue('undefined'))
    assert.isNull(common.parseValue(null))
    assert.isNull(common.parseValue('null'))
    assert.isTrue(common.parseValue(true))
    assert.isFalse(common.parseValue(false))
    assert.isTrue(common.parseValue('true'))
    assert.isFalse(common.parseValue('false'))
    assert.isNaN(common.parseValue(NaN))
    assert.isNaN(common.parseValue('NaN'))
    assert.equal(common.parseValue(''), '')
    assert.equal(common.parseValue('str'), 'str')
    assert.deepEqual(common.parseValue([]), [])
    assert.deepEqual(common.parseValue({}), {})
    assert.equal(common.parseValue(0), 0)
    assert.equal(common.parseValue(0.5), 0.5)
    assert.equal(common.parseValue('005'), 5)
    assert.equal(common.parseValue('+5'), 5)
    assert.equal(common.parseValue('-5'), -5)
    assert.equal(common.parseValue('2.'), '2.')
    assert.equal(common.parseValue('0.5'), 0.5)
    assert.equal(common.parseValue('0,bedroom.light1'), '0,bedroom.light1')

  it 'callPromised', ->
    data = 'param1'
    method = (param, cb) => cb(null, param)
    promised = common.callPromised(method, data)

    assert.equal(await promised, data);

    # check error
    errMethod = (param, cb) => cb('err')
    promised = common.callPromised(errMethod, data)

    assert.isRejected(promised);

  it 'isKindOfNumber', ->
    assert.isTrue(common.isKindOfNumber(0))
    assert.isTrue(common.isKindOfNumber(1))
    assert.isTrue(common.isKindOfNumber(-1))
    assert.isTrue(common.isKindOfNumber(0.5))
    assert.isTrue(common.isKindOfNumber(1.1))
    assert.isTrue(common.isKindOfNumber(-0.0001))
    assert.isTrue(common.isKindOfNumber(-1.111))
    assert.isTrue(common.isKindOfNumber('1'))
    assert.isTrue(common.isKindOfNumber('0'))
    assert.isTrue(common.isKindOfNumber('-1'))
    assert.isTrue(common.isKindOfNumber('0.5'))
    assert.isTrue(common.isKindOfNumber('1.1'))
    assert.isTrue(common.isKindOfNumber('-0.0001'))
    assert.isTrue(common.isKindOfNumber('-1.111'))

    assert.isFalse(common.isKindOfNumber('1a'))
    assert.isFalse(common.isKindOfNumber('a'))
    assert.isFalse(common.isKindOfNumber(true))
    assert.isFalse(common.isKindOfNumber(false))
    assert.isFalse(common.isKindOfNumber(undefined))
    assert.isFalse(common.isKindOfNumber(null))
    assert.isFalse(common.isKindOfNumber([]))
    assert.isFalse(common.isKindOfNumber({}))

  it 'isPromise', ->
    assert.isFalse(common.isPromise(null))
    assert.isFalse(common.isPromise(1))
    assert.isFalse(common.isPromise({}))
    assert.isFalse(common.isPromise({then: 1}))
    assert.isTrue(common.isPromise({then: () =>}))
    assert.isTrue(common.isPromise(Promise.resolve()))

#  it 'isEmpty', ->
#    assert.equal(common.isEmpty(undefined), true)
#    assert.equal(common.isEmpty(null), true)
#    assert.equal(common.isEmpty(''), true)
#    assert.equal(common.isEmpty([]), true)
#    assert.equal(common.isEmpty({}), true)
#    assert.equal(common.isEmpty(0), false)
#    assert.equal(common.isEmpty('a'), false)
#    assert.equal(common.isEmpty([1]), false)
#    assert.equal(common.isEmpty({a:1}), false)
#    assert.equal(common.isEmpty(false), false)
