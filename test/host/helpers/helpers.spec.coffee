helpers = require('../../../system/helpers/helpers')


describe 'helpers.helpers', ->
  it 'convertToLevel', ->
    assert.isTrue(helpers.convertToLevel(true))
    assert.isTrue(helpers.convertToLevel(1))
    assert.isTrue(helpers.convertToLevel('high'))
    assert.isTrue(helpers.convertToLevel('true'))
    assert.isTrue(helpers.convertToLevel('1'))
    assert.isTrue(helpers.convertToLevel('ON'))
    assert.isTrue(helpers.convertToLevel('On'))
    assert.isTrue(helpers.convertToLevel('on'))
    assert.isFalse(helpers.convertToLevel(false))
    assert.isFalse(helpers.convertToLevel(0))
    assert.isFalse(helpers.convertToLevel(5))
    assert.isFalse(helpers.convertToLevel('low, off and other...'))

  it 'parseValue', ->
    assert.isUndefined(helpers.parseValue(undefined))
    assert.isUndefined(helpers.parseValue('undefined'))
    assert.isNull(helpers.parseValue(null))
    assert.isNull(helpers.parseValue('null'))
    assert.isTrue(helpers.parseValue(true))
    assert.isFalse(helpers.parseValue(false))
    assert.isTrue(helpers.parseValue('true'))
    assert.isFalse(helpers.parseValue('false'))
    assert.isNaN(helpers.parseValue(NaN))
    assert.isNaN(helpers.parseValue('NaN'))
    assert.equal(helpers.parseValue(''), '')
    assert.equal(helpers.parseValue('str'), 'str')
    assert.deepEqual(helpers.parseValue([]), [])
    assert.deepEqual(helpers.parseValue({}), {})
    assert.equal(helpers.parseValue(0), 0)
    assert.equal(helpers.parseValue(0.5), 0.5)
    assert.equal(helpers.parseValue('005'), 5)
    assert.equal(helpers.parseValue('+5'), 5)
    assert.equal(helpers.parseValue('-5'), -5)
    assert.equal(helpers.parseValue('2.'), '2.')
    assert.equal(helpers.parseValue('0.5'), 0.5)

  it 'isDigitalInputInverted', ->
    assert.isFalse(helpers.isDigitalInputInverted(false, false, false))
    assert.isFalse(helpers.isDigitalInputInverted(false, true, false))
    # double invert
    assert.isFalse(helpers.isDigitalInputInverted(true, true, true))

    assert.isTrue(helpers.isDigitalInputInverted(true, false, false))
    assert.isTrue(helpers.isDigitalInputInverted(false, true, true))
    # don't use pullup
    assert.isTrue(helpers.isDigitalInputInverted(true, false, true))

  it 'invertIfNeed', ->
    assert.isTrue(helpers.invertIfNeed(true, false))
    assert.isTrue(helpers.invertIfNeed(false, true))
    assert.isFalse(helpers.invertIfNeed(false, false))
    assert.isFalse(helpers.invertIfNeed(true, true))

  it 'resolveEdge', ->
    assert.equal(helpers.resolveEdge(undefined), 'both')
    assert.equal(helpers.resolveEdge(undefined, true), 'both')
    assert.equal(helpers.resolveEdge('both'), 'both')
    assert.equal(helpers.resolveEdge('both', true), 'both')
    assert.equal(helpers.resolveEdge('rising', false), 'rising')
    assert.equal(helpers.resolveEdge('falling', false), 'falling')
    # invert
    assert.equal(helpers.resolveEdge('rising', true), 'falling')
    assert.equal(helpers.resolveEdge('falling', true), 'rising')

  it 'firstLetterToUpperCase', ->
    assert.equal(helpers.firstLetterToUpperCase('str str'), 'Str str')
    assert.equal(helpers.firstLetterToUpperCase('strStr'), 'StrStr')
    assert.equal(helpers.firstLetterToUpperCase('5str'), '5str')

  it 'callPromised', ->
    data = 'param1'
    method = (param, cb) => cb(null, param)
    promised = helpers.callPromised(method, data)

    assert.equal(await promised, data);

    # check error
    errMethod = (param, cb) => cb('err')
    promised = helpers.callPromised(errMethod, data)

    assert.isRejected(promised);

  it 'combineTopic', ->
    assert.equal(helpers.combineTopic('/', 'first', 'second', 'third'), 'first/second/third')

  it 'splitTopicId', ->
    assert.deepEqual(helpers.splitTopicId('/', 'id/sub/deeper'), [ 'id', 'sub/deeper' ])

  it 'splitFirstElement', ->
    assert.deepEqual(helpers.splitFirstElement('path/to/dest', '/'), [ 'path', 'to/dest' ])
    assert.deepEqual(helpers.splitFirstElement('path', '/'), [ 'path', undefined ])

  it 'splitLastElement', ->
    assert.deepEqual(helpers.splitLastElement('path/to/dest', '/'), [ 'dest', 'path/to' ])
    assert.deepEqual(helpers.splitLastElement('path', '/'), [ 'path', undefined ])

  it 'makeEventName', ->
    assert.equal(helpers.makeEventName('cat', 'topic', 'name', 'otherName'), 'cat|topic|name|otherName')
    assert.equal(helpers.makeEventName('cat', undefined, 'name'), 'cat|*|name')
