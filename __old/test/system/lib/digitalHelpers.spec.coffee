helpers = require('../../../system/lib/digitalHelpers')


describe 'system.lib.digitalHelpers', ->
  it 'resolveLevel', ->
    assert.isTrue(helpers.resolveLevel(true))
    assert.isTrue(helpers.resolveLevel(1))
    assert.isTrue(helpers.resolveLevel('high'))
    assert.isTrue(helpers.resolveLevel('true'))
    assert.isTrue(helpers.resolveLevel('1'))
    assert.isTrue(helpers.resolveLevel('ON'))
    assert.isTrue(helpers.resolveLevel('On'))
    assert.isTrue(helpers.resolveLevel('on'))
    assert.isFalse(helpers.resolveLevel(false))
    assert.isFalse(helpers.resolveLevel(0))
    assert.isFalse(helpers.resolveLevel(5))
    assert.isFalse(helpers.resolveLevel('low, off and other...'))

  it 'isDigitalPinInverted', ->
    assert.isFalse(helpers.isDigitalPinInverted(false, false, false))
    assert.isFalse(helpers.isDigitalPinInverted(false, true, false))
    # double invert
    assert.isFalse(helpers.isDigitalPinInverted(true, true, true))

    assert.isTrue(helpers.isDigitalPinInverted(true, false, false))
    assert.isTrue(helpers.isDigitalPinInverted(false, true, true))
    # don't use pullup
    assert.isTrue(helpers.isDigitalPinInverted(true, false, true))

  it 'invertIfNeed', ->
    assert.isTrue(helpers.invertIfNeed(true, false))
    assert.isTrue(helpers.invertIfNeed(false, true))
    assert.isFalse(helpers.invertIfNeed(false, false))
    assert.isFalse(helpers.invertIfNeed(true, true))

  it 'resolveEdge', ->
    assert.equal(helpers.resolveEdge(undefined), 2)
    assert.equal(helpers.resolveEdge(undefined, true), 2)
    assert.equal(helpers.resolveEdge('both'), 2)
    assert.equal(helpers.resolveEdge('both', true), 2)
    assert.equal(helpers.resolveEdge('rising', false), 0)
    assert.equal(helpers.resolveEdge('falling', false), 1)
    # invert
    assert.equal(helpers.resolveEdge('rising', true), 1)
    assert.equal(helpers.resolveEdge('falling', true), 0)

  it 'resolveInputResistorMode', ->
    assert.equal(helpers.resolveInputResistorMode(), 0)
    assert.equal(helpers.resolveInputResistorMode(false, false), 0)
    assert.equal(helpers.resolveInputResistorMode(true), 1)
    assert.equal(helpers.resolveInputResistorMode(true, true), 1)
    assert.equal(helpers.resolveInputResistorMode(undefined, true), 2)

  it 'resolveOutputResistorMode', ->
    assert.equal(helpers.resolveOutputResistorMode(), 0)
    assert.equal(helpers.resolveOutputResistorMode(true), 1)

  it 'stringifyPinMode', ->
    assert.equal(helpers.stringifyPinMode(), 'unset_unset')
    assert.equal(helpers.stringifyPinMode(undefined, 0), 'unset_unset')
    assert.equal(helpers.stringifyPinMode(0), 'input_unset')
    assert.equal(helpers.stringifyPinMode(1), 'output_unset')
    assert.equal(helpers.stringifyPinMode(0, 0), 'input_none')
    assert.equal(helpers.stringifyPinMode(0, 1), 'input_pullup')
    assert.equal(helpers.stringifyPinMode(1, 1), 'output_opendrain')
    assert.equal(helpers.stringifyPinMode(0, 2), 'input_pulldown')
