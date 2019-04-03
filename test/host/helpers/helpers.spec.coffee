helpers = require('../../../host/helpers/helpers')


describe.only 'helpers.helpers', ->
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
