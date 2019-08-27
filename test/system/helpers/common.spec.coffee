common = require('../../../system/lib/common')


describe.only 'system.hepers.common', ->
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

  it 'callPromised', ->
    data = 'param1'
    method = (param, cb) => cb(null, param)
    promised = common.callPromised(method, data)

    assert.equal(await promised, data);

    # check error
    errMethod = (param, cb) => cb('err')
    promised = common.callPromised(errMethod, data)

    assert.isRejected(promised);
